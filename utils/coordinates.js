const parseCoordinate = (value, min, max) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    return null;
  }

  return coordinate;
};

module.exports = parseCoordinate;
