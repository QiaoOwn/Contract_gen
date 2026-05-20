import type {NextConfig} from 'next';
const nextConfig: NextConfig = {
  distDir: '.next-build',
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: true,
  },
  // Avoid bundling @babel/core for Server Components / Route Handlers (fixes noisy
  // webpack "Critical dependency" warnings and speeds dev compiles on Windows).
  serverExternalPackages: ['@babel/core', 'browserslist'],
};

export default nextConfig;
