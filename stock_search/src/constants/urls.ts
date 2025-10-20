/**
 * 外部URL定数
 *
 * アプリケーション全体で使用される外部リンク、SNSリンク、寄付リンクなどを集約管理
 */

export const EXTERNAL_URLS = {
  /** SNSリンク */
  social: {
    twitter: "https://x.com/testkun08080",
    github: "https://github.com/testkun08080",
    githubRepo: "https://github.com/testkun08080/yfinance-jp-screener",
    githubRepoReadme: "https://github.com/testkun08080/yfinance-jp-screener#readme",
    email: "mailto:testkun.08080@gmail.com",
  },

  /** 寄付・サポートリンク */
  sponsorship: {
    githubSponsors: "https://github.com/sponsors/testkun08080",
    buyMeACoffee: "https://www.buymeacoffee.com/testkun08080",
    amazonBook: "https://amzn.to/3IEVRkq",
  },

  /** データソース */
  dataSources: {
    jpxData:
      "https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls",
    yfinanceAPI: "https://ranaroussi.github.io/yfinance/",
  },

  /** 法的情報・利用規約 */
  legal: {
    yahooTerms: "https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html",
    yahooDevTerms:
      "https://legal.yahoo.com/us/en/yahoo/terms/product-atos/apiforydn/index.html",
    yahooFinanceTerms: "https://finance.yahoo.com/about/terms",
  },
} as const;
