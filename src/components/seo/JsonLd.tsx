type JsonLdProps = {
  data: unknown;
  /**
   * Optional `id` for easier debugging in the rendered HTML.
   * Example: "jsonld-organization"
   */
  id?: string;
};

export function JsonLd({ data, id }: JsonLdProps) {
  // Prevent `</script>` injection by escaping `<`.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

