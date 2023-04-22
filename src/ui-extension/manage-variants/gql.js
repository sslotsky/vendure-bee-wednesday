export function gql(str, ...values) {
  return str.reduce((result, s, i) => `${result}${s}${values[i] || ""}`, "");;
}

export const customPrintQuery = gql`
  query CustomPrint($slug: String) {
    product(slug: $slug) {
      id
      name
      slug
      variants {
        id
        sku
        name
        enabled
        customFields {
          height
          width
          material
        }
      }
    }
  }
`;