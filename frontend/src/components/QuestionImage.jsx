// A question's image, as students and teachers see it. Images are served by the backend.
// imageAlt describes it for screen readers; with no description it's treated as decoration.
export default function QuestionImage({ imageId, imageAlt, className = "mt-4" }) {
  if (!imageId) return null;
  return (
    <img
      src={`/api/images/${imageId}`}
      alt={imageAlt ?? ""}
      className={`${className} max-h-72 w-auto max-w-full rounded-lg border border-gray-200 object-contain`}
    />
  );
}
