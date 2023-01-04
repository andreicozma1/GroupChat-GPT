import { getRandomMinMax } from "src/util/Utils";

interface ImageOptions {
	width?: number;
	height?: number;
}

const parseImageOptions = (options?: ImageOptions): ImageOptions => {
	return {
		width: options?.width || Math.round(getRandomMinMax(100, 800)),
		height: options?.height || Math.round(getRandomMinMax(100, 800)),
	};
};

/**
 * Gets an avatar image using the Robohash API based on the given seed
 * @param seed The seed to use for the image
 */
export const getRoboHashAvatarUrl = (seed: string) => {
	return `https://robohash.org/${seed}`;
};

/**
 * Gets an image using the Picsum API based on the given seed
 * @param seed The seed to use for the image
 * @param options The options to use for the image
 */
export const getPicsumImgUrl = (seed: string, options?: ImageOptions) => {
	options = parseImageOptions(options);
	seed = seed.replace(/ /g, "_");
	return `https://picsum.photos/seed/${seed}/${options.width}/${options.height}`;
};
