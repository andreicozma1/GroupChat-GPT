export const getAvatar = (seed: string) => `https://robohash.org/${seed}?set=set4&size=80x80`
export const getPicsum = (seed: string, width: number, height: number) => `https://picsum.photos/seed/${seed}/${width}/${height}`