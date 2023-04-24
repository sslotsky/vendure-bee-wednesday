export function gql(str, ...values) {
  return str.reduce((result, s, i) => `${result}${s}${values[i] || ""}`, "");;
}

export const customPrintQuery = gql`
  query CustomPrint($slug: String) {
    product(slug: $slug) {
      id
      name
      slug
      optionGroups {
        id
        code
        name
        options {
          id
          code
          name
        }
      }
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

export const createVariantMutation = gql`
  mutation CreateVariant($input: [CreateProductVariantInput!]!) {
    createProductVariants(input: $input) {
      __typename
    }
  }
`;

export const updateVariantsMutation = gql`
  mutation UpdateVariants($input: [UpdateProductVariantInput!]!) {
    updateProductVariants(input: $input) {
      __typename
    }
  }
`;

export const createProductOptionMutation = gql`
  mutation CreateProductOption($input: CreateProductOptionInput!) {
    createProductOption(input: $input) {
      __typename
    }
  }
`;