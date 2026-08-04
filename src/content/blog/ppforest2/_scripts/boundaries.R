# ppforest2-boundaries.R
# ---------------------------------------------------------------------------
# Generates the decision-boundary figure in the blog post
#   src/content/blog/ppforest2.md  ("ppforest2: Projection Pursuit Random
#   Forests in C++ and R").
#
# It fits a single axis-aligned tree (rpart) and a single oblique
# projection-pursuit tree (ppforest2::pptr) on the same 120-point dataset,
# then emits two self-contained, theme-adaptive inline SVG panels. The panels
# are pasted into the post's <figure>; re-running this script reproduces them
# byte-for-byte.
#
# Reproducibility
#   Environment: R 4.4.1
#   Packages:    ppforest2 0.1.1 (from source tarball; not yet on CRAN),
#                rpart 4.1.23, MASS 7.3-60.2, isoband 0.2.7
#   Randomness:  data via set.seed(42); pptr via seed = 7 (its own arg).
#   Colors are CSS custom properties (var(--ochre), var(--indigo), ...) so the
#   inline SVG follows the site's light/dark theme.
#
# Run (from the repo root):
#   Rscript scripts/ppforest2-boundaries.R
# Writes ppforest2-rpart.svg and ppforest2-pptr.svg to the current directory;
# their contents are what live inline in the post.
# ---------------------------------------------------------------------------

suppressMessages({library(ppforest2); library(rpart); library(MASS); library(isoband)})

## ---- data: two classes, elongated along the diagonal, separated across it ----
set.seed(42)
n <- 60; ang <- pi/4
R <- matrix(c(cos(ang), sin(ang), -sin(ang), cos(ang)), 2, 2)
Sig <- R %*% diag(c(0.95, 0.30)^2) %*% t(R)
ctr <- c(1.5, 1.5); d <- 0.80
muA <- ctr + d * c(-1, 1) / sqrt(2); muB <- ctr + d * c(1,-1) / sqrt(2)
A <- mvrnorm(n, muA, Sig); B <- mvrnorm(n, muB, Sig)
df <- data.frame(x = c(A[,1], B[,1]), y = c(A[,2], B[,2]),
                 class = factor(rep(c("A","B"), each = n)))

## ---- fit one axis-aligned tree (rpart) and one oblique tree (pptr) ----
fit_rp <- rpart(class ~ x + y, data = df, method = "class",
                control = rpart.control(cp = 0.005, minbucket = 4, xval = 0))
set.seed(7)
fit_pp <- pptr(x = df[, c("x", "y")], y = df$class, seed = 7)
mis_rp <- which(predict(fit_rp, df, type = "class") != df$class)
mis_pp <- which(predict(fit_pp, df[, c("x", "y")]) != df$class)

## ---- square window + SVG mapping ----
cx <- mean(range(df$x)); cy <- mean(range(df$y))
h  <- max(diff(range(df$x)), diff(range(df$y))) / 2 + 0.45
xr <- c(cx - h, cx + h); yr <- c(cy - h, cy + h)
VB <- 300; mrg <- 8; S <- VB - 2 * mrg
sx <- function(x) mrg + (x - xr[1]) / (xr[2] - xr[1]) * S
sy <- function(y) (VB - mrg) - (y - yr[1]) / (yr[2] - yr[1]) * S
r1 <- function(v) formatC(round(v, 1), format = "f", digits = 1)

pts_svg <- function() paste0(vapply(seq_len(nrow(df)), function(i) {
  col <- if (df$class[i] == "A") "var(--ochre)" else "var(--indigo)"
  sprintf('<circle cx="%s" cy="%s" r="3.3" fill="%s" stroke="var(--card)" stroke-width="0.8"/>',
          r1(sx(df$x[i])), r1(sy(df$y[i])), col)
}, character(1)), collapse = "")
rings_svg <- function(mis) if (length(mis)) paste0('<g fill="none" stroke="#d6483d" stroke-width="1.6">',
  paste0(vapply(mis, function(i) sprintf('<circle cx="%s" cy="%s" r="5.6"/>',
    r1(sx(df$x[i])), r1(sy(df$y[i]))), character(1)), collapse = ""), '</g>') else ""
wrap <- function(inner, label) paste0('<svg class="fig-plot" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" role="img" aria-label="', label, '">', inner, '</svg>')

## ---- rpart: isoband regions + isolines boundary, collinear-simplified (axis-aligned, lossless) ----
N <- 240
gx <- seq(xr[1], xr[2], length.out = N); gy <- seq(yr[1], yr[2], length.out = N)
grid <- expand.grid(x = gx, y = gy)
z_rp <- matrix(as.integer(predict(fit_rp, grid, type = "class") == "A"), N, N, byrow = TRUE)
simplify_xy <- function(x, y, tol = 1e-6) {
  n <- length(x); if (n < 3) return(cbind(x, y))
  keep <- 1; last <- 1
  for (i in 2:(n - 1)) {
    ax <- x[i]-x[last]; ay <- y[i]-y[last]; bx <- x[i+1]-x[last]; by <- y[i+1]-y[last]
    if (abs(ax*by - ay*bx) > tol) { keep <- c(keep, i); last <- i }
  }
  cbind(x[c(keep, n)], y[c(keep, n)])
}
band_path <- function(z, lo, hi) {
  b <- isobands(gx, gy, z, levels_low = lo, levels_high = hi)[[1]]
  if (is.null(b) || !length(b$x)) return("")
  paste(vapply(unique(b$id), function(k) {
    s <- b$id == k; m <- simplify_xy(b$x[s], b$y[s])
    paste0("M", paste0(r1(sx(m[,1])), ",", r1(sy(m[,2])), collapse = "L"), "Z")
  }, character(1)), collapse = "")
}
line_path <- function(z) {
  l <- isolines(gx, gy, z, levels = 0.5)[[1]]
  if (is.null(l) || !length(l$x)) return("")
  paste(vapply(unique(l$id), function(k) {
    s <- l$id == k; m <- simplify_xy(l$x[s], l$y[s])
    paste0("M", paste0(r1(sx(m[,1])), ",", r1(sy(m[,2])), collapse = "L"))
  }, character(1)), collapse = "")
}
rpart_svg <- wrap(label = "Decision regions of an rpart axis-aligned tree: rectangular regions split by a staircase boundary, with three points near the diagonal circled in red as misclassified.", paste0(
  '<path d="', band_path(z_rp, -0.5, 0.5), '" fill="var(--indigo)" fill-opacity="0.12"/>',
  '<path d="', band_path(z_rp,  0.5, 1.5), '" fill="var(--ochre)" fill-opacity="0.13"/>',
  '<path d="', line_path(z_rp), '" fill="none" stroke="var(--ink-2)" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>',
  pts_svg(), rings_svg(mis_rp)))

## ---- pptr: exact linear boundary + convex half-plane polygons ----
pa <- fit_pp$root$projector[1]; pb <- fit_pp$root$projector[2]; pc <- fit_pp$root$cutpoint
# class A where pa*x + pb*y < pc
ends <- list()
for (xx in xr) { yy <- (pc - pa*xx)/pb; if (yy >= yr[1]-1e-9 && yy <= yr[2]+1e-9) ends[[length(ends)+1]] <- c(xx, yy) }
for (yy in yr) { xx <- (pc - pb*yy)/pa; if (xx >= xr[1]-1e-9 && xx <= xr[2]+1e-9) ends[[length(ends)+1]] <- c(xx, yy) }
E <- unique(do.call(rbind, ends)); E <- E[1:2, , drop = FALSE]   # two chord endpoints
corners <- as.matrix(expand.grid(x = xr, y = yr))
sideA <- (pa*corners[,1] + pb*corners[,2] - pc) < 0
poly <- function(M) {   # convex polygon, angle-sorted
  ce <- colMeans(M); o <- order(atan2(M[,2]-ce[2], M[,1]-ce[1])); M <- M[o, , drop = FALSE]
  paste0("M", paste0(r1(sx(M[,1])), ",", r1(sy(M[,2])), collapse = "L"), "Z")
}
polyA <- poly(rbind(E, corners[sideA, , drop = FALSE]))
polyB <- poly(rbind(E, corners[!sideA, , drop = FALSE]))
bd_pp <- paste0("M", r1(sx(E[1,1])), ",", r1(sy(E[1,2])), "L", r1(sx(E[2,1])), ",", r1(sy(E[2,2])))
pptr_svg <- wrap(label = "Decision regions of a ppforest2 oblique projection-pursuit tree: two regions split by a single diagonal cut, with one point circled in red as misclassified.", paste0(
  '<path d="', polyB, '" fill="var(--indigo)" fill-opacity="0.12"/>',
  '<path d="', polyA, '" fill="var(--ochre)" fill-opacity="0.13"/>',
  '<path d="', bd_pp, '" fill="none" stroke="var(--ink-2)" stroke-width="1.7" stroke-linecap="round"/>',
  pts_svg(), rings_svg(mis_pp)))

writeLines(rpart_svg, "ppforest2-rpart.svg")
writeLines(pptr_svg,  "ppforest2-pptr.svg")
cat(sprintf("rpart: %d splits, %d/%d misclassified\n",
            sum(fit_rp$frame$var != "<leaf>"), length(mis_rp), nrow(df)))
cat(sprintf("pptr : 1 oblique split (%.4f*x + %.4f*y = %.5f), %d/%d misclassified\n",
            pa, pb, pc, length(mis_pp), nrow(df)))
cat("wrote ppforest2-rpart.svg and ppforest2-pptr.svg\n")
