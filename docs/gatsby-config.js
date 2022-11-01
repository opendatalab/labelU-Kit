module.exports = {
  pathPrefix: `/labelU-Kit/`,
  siteMetadata: {
    siteTitle: `lblab Component Docs`,
    defaultTitle: `lblab React Component Docs`,
    siteTitleShort: `lblab React Component Docs`,
    siteDescription: `Out of the box lblab react components for annotation image,video or audio quickly`,
    siteImage: `/banner.png`,
    siteLanguage: `en`,
    themeColor: `#8257E6`,
  },
  plugins: [
    {
      resolve: `@rocketseat/gatsby-theme-docs`,
      options: {
        configPath: `src/config`,
        docsPath: `src/content`,
        yamlFilesPath: `src/yamlFiles`,
        repositoryUrl: `https://gitlab.shlab.tech/wuhui/lb-smart`,
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `lblab React Component Docs`,
        short_name: `lblab React Component Docs`,
        start_url: `/`,
        background_color: `#ffffff`,
        display: `standalone`,
        icon: `static/favicon.png`,
      },
    },
    `gatsby-plugin-sitemap`,
    // {
    //   resolve: `gatsby-plugin-google-analytics`,
    //   options: {
    //     trackingId: `YOUR_ANALYTICS_ID`,
    //   },
    // },
    `gatsby-plugin-remove-trailing-slashes`,
    {
      resolve: `gatsby-plugin-canonical-urls`,
      options: {
        siteUrl: `https://rocketdocs.netlify.app`,
      },
    },
    `gatsby-plugin-offline`,
  ],
};
