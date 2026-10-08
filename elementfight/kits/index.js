import { TimeKit } from './time.js';
import { ElectricityKit } from './electricity.js';
import { LightKit } from './light.js';
import { FlashKit } from './flash.js';

export const KITS = {
  Time: TimeKit,
  Electricity: ElectricityKit,
  Light: LightKit,
  Flash: FlashKit
};


export function getKit(blade) {
  return KITS[blade];
}


export function getRandomBlade() {

  const blades =
    Object.keys(KITS);

  return blades[
    Math.floor(
      Math.random() * blades.length
    )
  ];
}
