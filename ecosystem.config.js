/**
 * PM2 Ecosystem Configuration
 * Gerenciamento de processos Next.js em modo cluster para alta disponibilidade
 * 
 * Comandos úteis:
 * - pm2 start ecosystem.config.js          # Iniciar aplicação
 * - pm2 stop ecosystem.config.js           # Parar aplicação
 * - pm2 restart ecosystem.config.js        # Reiniciar aplicação
 * - pm2 reload ecosystem.config.js         # Reload zero-downtime
 * - pm2 logs                               # Ver logs
 * - pm2 monit                              # Monitor em tempo real
 */

module.exports = {
  apps: [
    {
      name: 'portal-economico',
      script: './node_modules/next/dist/bin/next',
      args: 'start',
      
      // Modo cluster para utilizar múltiplos cores
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: 'cluster',
      
      // Variáveis de ambiente
      env: {
        NODE_ENV: 'development',
        PORT: 5173,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },
      
      // Configurações de restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Política de memória
      max_memory_restart: '1G',
      
      // Logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Watch mode (desenvolvimento)
      watch: process.env.NODE_ENV !== 'production',
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        '.next',
        '*.log',
      ],
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Health check
      // PM2 vai verificar se a aplicação responde
      health_check_grace_period: 30000,
    },
  ],
  
  // Configurações de deploy (opcional - para múltiplos servidores)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/yourrepo.git',
      path: '/var/www/portal-economico',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install -y git nodejs npm',
    },
  },
};
