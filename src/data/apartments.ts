export interface Apartment {
  name: string;
  flatNumberStart: number;
  flatNumberEnd: number;
}

export const apartments: Apartment[] = [
  {
    name: 'tulip',
    flatNumberStart: 1001,
    flatNumberEnd: 5001,
  },
  {
    name: 'elysian',
    flatNumberStart: 1001,
    flatNumberEnd: 1191,
  },
];
