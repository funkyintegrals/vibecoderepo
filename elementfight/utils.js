export function clamp(
  value,
  min,
  max
) {

  return Math.min(
    Math.max(value, min),
    max
  );
}


export function delay(milliseconds) {

  return new Promise(resolve => {

    setTimeout(
      resolve,
      milliseconds
    );

  });
}
