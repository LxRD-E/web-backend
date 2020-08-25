/**
 * PM2 Ecosystem File PROD
 */
module.exports = {
    apps: [
        {
            name: "BlocksHub API",
            script: "./dist/server.js",
            // purely so that soft reloading works decently
            instances: 2,
            exec_mode: "cluster",
            watch: false,
            env: {
                "NODE_ENV": "production",
                "PORT": 6901,
                "WS_PORT": 6902,
            },
            listen_timeout: 60000,
            shutdown_with_message: true,
        }
    ]
}