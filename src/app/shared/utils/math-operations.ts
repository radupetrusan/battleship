export const getRandom = (max: number) => {
    return Math.floor(Math.random() * Math.floor(max));
};

export const getRandomFromInterval = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
};
