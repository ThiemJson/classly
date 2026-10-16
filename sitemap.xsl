<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="sitemap xhtml">
  <xsl:output method="html" encoding="UTF-8" doctype-system="about:legacy-compat"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Classly XML Sitemap</title>
        <style>
          :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #19213d; background: #f6f8fc; }
          main { width: min(1120px, calc(100% - 32px)); margin: 48px auto; }
          h1 { margin: 0 0 8px; font-size: clamp(28px, 5vw, 42px); letter-spacing: -0.04em; }
          p { margin: 0 0 24px; color: #64708b; }
          a { color: #4d63d8; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .table-wrap { overflow-x: auto; border: 1px solid #dfe4ef; border-radius: 16px; background: #fff; box-shadow: 0 12px 32px rgba(37, 48, 85, 0.08); }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 14px 18px; text-align: left; border-bottom: 1px solid #edf0f6; vertical-align: top; }
          th { color: #4d5873; background: #f9faff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
          tr:last-child td { border-bottom: 0; }
          td:first-child { min-width: 520px; overflow-wrap: anywhere; }
          td:nth-child(2), td:nth-child(3) { white-space: nowrap; color: #64708b; }
          @media (max-width: 640px) { main { margin: 28px auto; } th, td { padding: 12px; } td:first-child { min-width: 360px; } }
        </style>
      </head>
      <body>
        <main>
          <h1>Classly XML Sitemap</h1>
          <p>
            This sitemap contains <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong> indexable URLs and their localized alternatives.
          </p>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Last updated</th>
                  <th>Languages</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
                    <td>
                      <xsl:choose>
                        <xsl:when test="sitemap:lastmod"><xsl:value-of select="sitemap:lastmod"/></xsl:when>
                        <xsl:otherwise>—</xsl:otherwise>
                      </xsl:choose>
                    </td>
                    <td><xsl:value-of select="count(xhtml:link)"/></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
