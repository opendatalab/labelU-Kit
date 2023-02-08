import React from "react";
import { useTheme, Global, css } from "@emotion/react";

export default function GlobalStyle() {
  const theme = useTheme();

  return (
    <Global
      styles={css`
        *,
        *::after,
        *::before {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          overflow-y: scroll;
          font-size: 16px;
          font-family: ${theme.fonts.body};
          background-color: ${theme.colors.background};
          text-rendering: optimizelegibility;
          -webkit-font-smoothing: antialiased;
        }

        pre {
          font-family: ${theme.fonts.pre} !important;
        }

        h1 {
          margin-bottom: 24px;
          color: ${theme.colors.title};
          font-weight: bold;
          font-size: 32px;
        }

        h2 {
          font-size: 24px;
        }

        h3 {
          font-size: 18px;
        }

        h4 {
          font-size: 16px;
        }

        h2,
        h3,
        h4,
        h5,
        h6 {
          margin: 24px 0 16px 0;
          color: ${theme.colors.title};
          font-weight: bold;
        }

        p {
          margin-bottom: 16px;
          color: ${theme.colors.text};
          font-weight: 400;
          font-size: 16px;
          line-height: 28px;
        }

        code.inline-code {
          display: inline-block;
          padding: 0.2em;
          color: rgba(248, 248, 242);
          font-size: 14px;
          font-family: ${theme.fonts.pre};
          font-variant: no-common-ligatures no-discretionary-ligatures
            no-historical-ligatures no-contextual;
          line-height: 1;
          vertical-align: middle;
          background-color: #44475a;
          border-radius: 3px;
          font-feature-settings: "clig" 0, "calt" 0;
        }

        h1 code.inline-code,
        h2 code.inline-code {
          padding: 4px;
          font-size: calc(100% - 5px);
        }

        a {
          color: ${theme.colors.text};
          font-weight: bold;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }

        blockquote {
          width: 100%;
          margin-bottom: 16px;

          p {
            margin: 0;
            padding: 1rem;
            color: ${theme.colors.components.blockquote.text};
            background: ${theme.colors.components.blockquote.background};
            border-radius: 5px;

            a {
              color: ${theme.colors.components.blockquote.text};
            }
          }
        }

        hr {
          height: 0;
          border: 0;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        }

        table {
          width: 100%;
          margin-top: -4px;
          margin-bottom: 16px;
          border-collapse: separate;
          border-spacing: 0 4px;

          th,
          td {
            margin: 0;
            padding: 12px;
            color: ${theme.colors.text};
            background-color: ${theme.colors.shape};
            border: solid 1px ${theme.colors.shape};
            border-style: solid none;

            :first-of-type {
              border-left-style: solid;
              border-top-left-radius: 5px;
              border-bottom-left-radius: 5px;
            }

            :last-child {
              border-right-style: solid;
              border-top-right-radius: 5px;
              border-bottom-right-radius: 5px;
            }
          }

          tr {
            th {
              color: ${theme.colors.title};
              font-weight: bold;
              text-align: left;
            }
          }
        }

        iframe {
          margin-bottom: 16px;
        }

        img {
          max-width: 100%;
        }

        ul,
        ol {
          margin-bottom: 16px;
          padding-left: 15px;
          color: ${theme.colors.text};

          li {
            line-height: 28px;
          }
        }

        li ul,
        li ol {
          margin-bottom: 0;
        }

        .gatsby-highlight {
          position: relative;
          z-index: 0;
          margin: 0 0 16px 0;
          overflow: auto;
          font-family: ${theme.fonts.pre} !important;
          font-variant: no-common-ligatures no-discretionary-ligatures
            no-historical-ligatures no-contextual;

          .token {
            font-style: normal !important;
          }
        }

        div[class$="StyledEditor"] {
          font-family: ${theme.fonts.pre} !important;
        }

        pre[class*="language-"] code {
          font-family: inherit;
        }

        pre[class*="language-"]::before {
          position: absolute;
          top: 0;
          left: 1rem;
          padding: 0.25rem 0.5rem;
          color: #232129;
          font-size: 12px;
          font-family: inherit;
          line-height: 1;
          letter-spacing: 0.075em;
          text-align: right;
          text-transform: uppercase;
          background: #d9d7e0;
          border-radius: 0 0 4px 4px;
        }

        pre[class~="language-js"]::before,
        pre[class~="language-javascript"]::before {
          background: #f7df1e;
          content: "js";
        }

        pre[class~="language-jsx"]::before {
          background: #61dafb;
          content: "jsx";
        }

        pre[class~="language-typescript"]::before,
        pre[class~="language-ts"]::before {
          color: #fff;
          background: #294e80;
          content: "ts";
        }

        pre[class~="language-tsx"]::before {
          color: #fff;
          background: #294e80;
          content: "tsx";
        }

        pre[class~="language-graphql"]::before {
          color: #fff;
          background: #e10098;
          content: "GraphQL";
        }

        pre[class~="language-html"]::before {
          color: #fff;
          background: #005a9c;
          content: "html";
        }

        pre[class~="language-css"]::before {
          color: #fff;
          background: #ff9800;
          content: "css";
        }

        pre[class~="language-mdx"]::before {
          color: #fff;
          background: #f9ac00;
          content: "mdx";
        }

        pre[class~="language-shell"]::before {
          content: "shell";
        }

        pre[class~="language-sh"]::before {
          content: "sh";
        }

        pre[class~="language-bash"]::before {
          content: "bash";
        }

        pre[class~="language-yaml"]::before,
        pre[class~="language-yml"]::before {
          background: #ffa8df;
          content: "yaml";
        }

        pre[class~="language-markdown"]::before {
          content: "md";
        }

        pre[class~="language-json"]::before,
        pre[class~="language-json5"]::before {
          background: linen;
          content: "json";
        }

        pre[class~="language-diff"]::before {
          background: #e6ffed;
          content: "diff";
        }

        pre[class~="language-text"]::before {
          background: #fff;
          content: "text";
        }

        pre[class~="language-flow"]::before {
          background: #e8bd36;
          content: "flow";
        }
      `}
    />
  );
}
