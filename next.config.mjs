/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Next.js 16 defaults to Turbopack and warns if it detects a project
  // that might expect webpack-specific config without an explicit
  // Turbopack config. We don't have any custom webpack config, but an
  // empty object here satisfies the check and silences the warning.
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
  turbopack: {},
  // Cabeçalhos de segurança básicos, aplicados a toda rota. Não mudam
  // nenhum comportamento do app — são só uma camada extra de proteção
  // do navegador contra clickjacking, MIME sniffing, etc.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Impede que o site seja carregado dentro de um <iframe> de
          // outro domínio (proteção contra clickjacking).
          { key: 'X-Frame-Options', value: 'DENY' },
          // Impede que o navegador tente "adivinhar" o tipo de um arquivo
          // diferente do Content-Type declarado.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Não vaza a URL completa (que pode conter dados) como referrer
          // para sites externos.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Desliga APIs sensíveis do navegador que o app não usa.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
