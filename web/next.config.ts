import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: 'export',

  // GitHub Pages serves at /bioregionalknowledgecommons/
  basePath: isGitHubPages ? '/bioregionalknowledgecommons' : '',
  assetPrefix: isGitHubPages ? '/bioregionalknowledgecommons/' : undefined,

  // Image optimization must be disabled for static export
  images: {
    unoptimized: true,
  },

  // Trailing slashes help with static file serving on GitHub Pages
  trailingSlash: true,
};

export default nextConfig;
