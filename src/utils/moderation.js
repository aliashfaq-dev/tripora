
const blockedPatterns = [
  /\bf+u+c+k+/i,
  /\bs+h+i+t+/i,
  /\bb+i+t+c+h+/i,
  /\ba+s+s+h+o+l+e+/i,
  /\b(cock|dick|pussy|whore|slut)\b/i,
  /\b(kill yourself|go die|suicide yourself)\b/i,
];

const spamPatterns = [
  /https?:\/\/[^\s]+/gi,
  /(?:buy now|click here|guaranteed profit|free money)/i,
];

export function moderateTripContent(form = {}) {
  const text = [
    form.title,
    form.shortDescription,
    form.fullDescription,
    form.requirements,
    form.cancellationPolicy,
    ...(form.highlights || []),
    ...(form.includedServices || []),
    ...(form.excludedServices || []),
    ...(form.itinerary || []).flatMap((x) => Object.values(x || {})),
  ]
    .filter(Boolean)
    .join(" ");

  if (blockedPatterns.some((pattern) => pattern.test(text))) {
    return {
      ok: false,
      message:
        "Your post contains abusive or prohibited language. Please edit it before submitting.",
    };
  }

  const links = text.match(spamPatterns[0]) || [];

  if (
    links.length > 3 ||
    spamPatterns.slice(1).some((pattern) => pattern.test(text))
  ) {
    return {
      ok: false,
      message:
        "Your post looks promotional or spam-like. Remove excessive links or misleading claims.",
    };
  }

  return {
    ok: true,
    message: "Safety check passed.",
  };
}
