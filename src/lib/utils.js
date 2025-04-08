export function padBase64(input) {
  var segmentLength = 4;
  var stringLength = input.length;
  var diff = stringLength % segmentLength;

  if (!diff) {
    return input;
  }

  var padLength = segmentLength - diff;
  var paddedStringLength = stringLength + padLength;
  var buffer = input;

  while (padLength--) {
    buffer += "=";
  }
  return buffer.toString();
}

export function extractTitle(code) {
  const regex = code.match(/<title>(.*?)<\/title>/);
  return regex && regex[1] ? regex[1] : "untitled";
}
