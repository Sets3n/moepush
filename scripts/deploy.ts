import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const dbName = process.env.D1_DATABASE_NAME || 'moepush-db';
const kvNamespaceName = process.env.KV_NAMESPACE_NAME || 'moepush-token-cache';
const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const projectName = process.env.PROJECT_NAME || 'moepush';

const run = (command: string, args: string[]) => {
    execFileSync(command, args, { stdio: 'inherit' });
};

const read = (command: string, args: string[]) => {
    return execFileSync(command, args, { encoding: 'utf-8' });
};

const requireCloudflareEnv = () => {
    const missing = [
        ['CLOUDFLARE_API_TOKEN', cloudflareApiToken],
        ['CLOUDFLARE_ACCOUNT_ID', accountId],
    ].filter(([, value]) => !value);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.map(([name]) => name).join(', ')}`);
    }
};

const cloudflareRequest = async <T>(pathName: string, init: RequestInit = {}) => {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${pathName}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${cloudflareApiToken}`,
            'Content-Type': 'application/json',
            ...init.headers,
        },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) as T & { success?: boolean, errors?: unknown[] } : {} as T & { success?: boolean, errors?: unknown[] };

    if (!response.ok || data.success === false) {
        throw new Error(`Cloudflare API ${init.method || 'GET'} ${pathName} failed (${response.status} ${response.statusText}): ${text}`);
    }

    return data;
};

const setupWranglerConfig = () => {
    const wranglerExamplePath = path.resolve('wrangler.example.json');
    const wranglerConfigPath = path.resolve('wrangler.json');

    const wranglerConfig = fs.readFileSync(wranglerExamplePath, 'utf-8');
    const json = JSON.parse(wranglerConfig);
    json.d1_databases[0].database_name = dbName;
    json.name = projectName;
    fs.writeFileSync(wranglerConfigPath, JSON.stringify(json, null, 2));
};

const checkAndCreateKvNamespace = async () => {
    type KvNamespace = { id: string, title: string };
    type KvListResponse = { result: KvNamespace[] };
    type KvCreateResponse = { result: KvNamespace };

    const getNamespaceId = async () => {
        const data = await cloudflareRequest<KvListResponse>('/storage/kv/namespaces');
        return data.result.find((ns) => ns.title === kvNamespaceName)?.id;
    };

    let nsId = await getNamespaceId();

    if (!nsId) {
        console.log(`Creating KV namespace: ${kvNamespaceName}`);
        const data = await cloudflareRequest<KvCreateResponse>('/storage/kv/namespaces', {
            method: 'POST',
            body: JSON.stringify({ title: kvNamespaceName }),
        });
        nsId = data.result.id || await getNamespaceId();
        if (!nsId) {
            throw new Error('Failed to create KV namespace');
        }
    } else {
        console.log(`KV namespace ${kvNamespaceName} already exists`);
    }

    const wranglerConfigPath = path.resolve('wrangler.json');
    const wranglerConfig = JSON.parse(fs.readFileSync(wranglerConfigPath, 'utf-8'));
    wranglerConfig.kv_namespaces[0].id = nsId;
    fs.writeFileSync(wranglerConfigPath, JSON.stringify(wranglerConfig, null, 2));
};

const checkAndCreateDatabase = () => {
    let dbId;

    const getDatabaseId = () => {
        const dbList = read('wrangler', ['d1', 'list', '--json']);
        const databases = JSON.parse(dbList);
        return databases.find((db: any) => db.name === dbName)?.uuid;
    }

    try {
        dbId = getDatabaseId();
    } catch (error) {
        console.error('Error listing databases:', error);
    }

    if (!dbId) {
        console.log(`Creating new D1 database: ${dbName}`);
        run('wrangler', ['d1', 'create', dbName]);
        dbId = getDatabaseId();
        if (!dbId) {
            throw new Error('Failed to create database');
        }
    } else {
        console.log(`Database ${dbName} already exists`);
    }

    const wranglerConfigPath = path.resolve('wrangler.json');
    const wranglerConfig = JSON.parse(fs.readFileSync(wranglerConfigPath, 'utf-8'));
    wranglerConfig.d1_databases[0].database_id = dbId;
    fs.writeFileSync(wranglerConfigPath, JSON.stringify(wranglerConfig, null, 2));
};

const applyMigrations = () => {
    run('wrangler', ['d1', 'migrations', 'apply', dbName, '--remote']);
};

const createPagesSecret = () => {
    const envFilePath = path.resolve('.env');
    const envVariables = [
        `AUTH_SECRET=${process.env.AUTH_SECRET}`,
        `AUTH_GITHUB_ID=${process.env.AUTH_GITHUB_ID}`,
        `AUTH_GITHUB_SECRET=${process.env.AUTH_GITHUB_SECRET}`,
        `DISABLE_REGISTER=${process.env.DISABLE_REGISTER}`,
    ];
    fs.writeFileSync(envFilePath, envVariables.join('\n'));
    run('wrangler', ['pages', 'secret', 'bulk', '.env', '--project-name', projectName]);
};

const deployPages = () => {
    console.log('Deploying to Cloudflare Pages...');
    run('pnpm', ['run', 'pages:build']);
    run('wrangler', ['pages', 'deploy', '--project-name', projectName, '--branch', 'main']);
    console.log('Deployment completed successfully');
};

const checkProjectExists = async () => {
    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${cloudflareApiToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 404) {
            console.log(`Project ${projectName} does not exist. Creating...`);
            await createProject();
            return;
        }

        const text = await response.text();
        const data = text ? JSON.parse(text) as { success?: boolean } : {};

        if (!response.ok || data.success === false) {
            throw new Error(`Cloudflare API GET /pages/projects/${projectName} failed (${response.status} ${response.statusText}): ${text}`);
        }

        console.log(`Project ${projectName} already exists.`);
    } catch (error) {
        console.error('Error checking project existence:', error);
        throw error;
    }
};

const createProject = async () => {
    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${cloudflareApiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: projectName,
                production_branch: 'main',
            }),
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) as { success: boolean, result: { name: string } } : { success: false, result: { name: '' } };
        
        if (!response.ok || !data.success) {
            throw new Error(`Error creating project (${response.status} ${response.statusText}): ${text}`);
        }

        // 等待项目创建完成
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 验证项目是否真正创建成功
        const verifyResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`,
            {
                headers: {
                    Authorization: `Bearer ${cloudflareApiToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const verifyText = await verifyResponse.text();
        const verifyData = verifyText ? JSON.parse(verifyText) as { success: boolean } : { success: false };
        if (!verifyResponse.ok || !verifyData.success) {
            throw new Error(`Project creation verification failed (${verifyResponse.status} ${verifyResponse.statusText}): ${verifyText}`);
        }

        console.log(`Project ${projectName} created and verified successfully`);
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
};

const main = async () => {
    try {
        requireCloudflareEnv();
        setupWranglerConfig();
        await checkProjectExists();
        checkAndCreateDatabase();
        await checkAndCreateKvNamespace();
        applyMigrations();
        createPagesSecret();
        deployPages();

        console.log('🎉 All deployment steps completed successfully!');
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
};

main();
