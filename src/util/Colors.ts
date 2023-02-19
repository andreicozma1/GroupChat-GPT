import {charSum, getRandomMinMax} from "src/util/Utils";

export interface ColorConfig {
    minLightness?: number;
    maxLightness?: number;
    minSaturation?: number;
    maxSaturation?: number;
    minHue?: number;
    maxHue?: number;
    minAlpha?: number;
    maxAlpha?: number;
}

export const getSeededQColor = (
    seed: string | number,
    minNum?: number,
    maxNum?: number,
    excludeKeywords?: string[],
    shuffle = true
) => {
    // based on the seed pick a color from the list of all quasar colors
    // do not use random here, because we want the same seed to always return the same color
    minNum = minNum ?? 0;
    maxNum = maxNum ?? allQuasarColors.length - 1;
    // create a flat list of all colors between minNum and maxNum inclusive
    // now interleave the colors
    const interleavedColors = allQuasarColors
        .slice(minNum, maxNum + 1)
        .reduce((acc, val) => {
            val.forEach((v, i) => {
                if (!acc[i]) {
                    acc[i] = [];
                }
                acc[i].push(v);
            });
            return acc;
        }, [] as string[][]);
    // now flatten the array
    let colors = interleavedColors.flat();
    if (typeof seed === "string") {
        seed = charSum(seed);
    }

    if (excludeKeywords) {
        colors = colors.filter((color) => {
            return !excludeKeywords.some((keyword) => color.includes(keyword));
        });
    }

    // shuffle the array deterministically
    if (shuffle) {
        colors = colors.sort((a, b) => {
                return charSum(a) - charSum(b);
            }
        );
    }

    return colors[seed % colors.length];
};

const getSeededColorHex = (seed: string, config: ColorConfig) => {
    const hue = getRandomMinMax(config.minHue ?? 0, config.maxHue ?? 360);
    const saturation = getRandomMinMax(
        config.minSaturation ?? 0,
        config.maxSaturation ?? 100
    );
    const lightness = getRandomMinMax(
        config.minLightness ?? 0,
        config.maxLightness ?? 100
    );
    const alpha = getRandomMinMax(config.minAlpha ?? 0, config.maxAlpha ?? 1);

    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
};

const baseQuasarColors = [
    "red",
    "pink",
    "purple",
    "deep-purple",
    "indigo",
    "blue",
    "light-blue",
    "cyan",
    "teal",
    "green",
    "light-green",
    "lime",
    "yellow",
    "amber",
    "orange",
    "deep-orange",
    "brown",
    "grey",
    "blue-grey",
];

const allQuasarColors = Array.from(Array(15).keys()).map((i) => {
    if (i === 0) {
        return baseQuasarColors;
    }
    return baseQuasarColors.map((c) => c + "-" + i);
});
