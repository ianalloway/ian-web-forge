/**
 * Re-export of the standalone `@ianalloway/matrix-rain` package.
 *
 * The implementation now lives in its own published npm package
 * (https://github.com/ianalloway/matrix-rain). This file is kept as a
 * thin re-export so existing page imports
 * (`import MatrixRain from '@/components/MatrixRain'`) keep working
 * without churn. New code should import directly from
 * `@ianalloway/matrix-rain`.
 */
export { default } from '@ianalloway/matrix-rain';
export type { MatrixRainProps } from '@ianalloway/matrix-rain';