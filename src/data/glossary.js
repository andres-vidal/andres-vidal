// Master glossary for the blog. Posts mark term occurrences inline with
// <abbr data-term="KEY">…</abbr>; the rehype-glossary plugin turns each into a
// linked, id'd occurrence and builds the glossary from the terms actually used.
export const glossary = {
  ppf: {
    abbr: "PPF",
    full: "Projection Pursuit Random Forests",
    def: "A random forest whose trees split on a projection, a linear combination of variables, rather than a single variable, so its decision boundaries can run oblique to the axes.",
  },
  pp: {
    abbr: "PP",
    full: "Projection Pursuit",
    def: "Choosing an interesting projection of the data by optimizing an index; the technique that picks each oblique split.",
  },
  lda: {
    abbr: "LDA",
    full: "Linear Discriminant Analysis",
    def: "A classical method for the linear combination of variables that best separates the classes; here it supplies the index a projection-pursuit split maximizes.",
  },
  cli: {
    abbr: "CLI",
    full: "Command-line Interface",
    def: "A way to run the tool from a terminal or script, without going through R.",
  },
  pda: {
    abbr: "PDA",
    full: "Penalized Discriminant Analysis",
    def: "A regularized variant of LDA for correlated or high-dimensional data (Hastie, Buja & Tibshirani, 1995).",
  },
  cran: {
    abbr: "CRAN",
    full: "Comprehensive R Archive Network",
    def: "The central repository of R packages. Being on it means a package has passed its checks and installs with install.packages().",
  },
};
