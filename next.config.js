/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Configurações de imagens (se usar next/image)
  images: {
    unoptimized: true, // Necessário para exportação estática
  },
  
  // Configurações de trailing slash
  trailingSlash: true,
  
  // Redirecionamentos (opcional)
  async redirects() {
    return [
      // Redirecionar /cadastro para /cadastro/
      // (trailingSlash já cuida disso)
    ];
  },
  
  // Headers de segurança (opcional)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
