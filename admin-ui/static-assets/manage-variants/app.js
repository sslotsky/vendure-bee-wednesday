import html from "https://cdn.skypack.dev/solid-js/html";
import {
  createResource,
  For
} from "https://cdn.skypack.dev/solid-js";
import { customPrintQuery } from './gql.js';

async function getProducts() {
  return VendureUiClient.graphQlQuery(customPrintQuery, { slug: 'custom-print-3' });
}

function getSizes(variants) {
  return variants.sort((x, y) => {
    const areaX = x.customFields.height * x.customFields.width;
    const areaY = y.customFields.height * y.customFields.width;

    if (areaX === areaY) {
      return x.customFields.width - y.customFields.width;
    }

    return areaX - areaY;
  })
    .map(v => `${v.customFields.width} x ${v.customFields.height}`)
    .filter((val, idx, arr) => arr.indexOf(val) === idx);
}

function getMaterials(variants) {
  return variants.map((v) => v.customFields.material)
    .filter((val, idx, arr) => arr.indexOf(val) === idx);
}

function VariantCell(props) {
  return html`
    <td
      onClick=${() => {
        if (props.variant?.enabled) {
          alert('disabling variant');
        } else if (props.variant) {
          alert('enabling variant');
        } else {
          alert('creating variant');
        }
      }}
    >${() => props.variant?.enabled ? 'Yes' : 'No'}</td>
  `;
}

function VariantTable(props) {
  return html`
    <table>
      <thead>
        <tr>
          <th></th>
          <${For} each=${() => getMaterials(props.variants)}
            >${material => html`
              <th>${material}</th>
            `}<//
          >
        </tr>
      </thead>
      <tbody>
        <${For} each=${() => getSizes(props.variants)}
          >${size => html`
            <tr>
              <td>${size}</td>
              <${For} each=${() => getMaterials(props.variants)}
                >${material => html`
                  <${VariantCell} variant=${() => {
                    return props.variants.find(v => {
                      return v.customFields.material === material &&
                        `${v.customFields.width} x ${v.customFields.height}` === size;
                    });
                  }}><//>
                `}<//
              >
            </tr>
          `}<//
        >
      </tbody>
    </table>
  `
}

export const App = () => {
  const [productData] = createResource(getProducts);

  return html`
    <div>
      <${VariantTable} variants=${() => productData()?.product?.variants ?? []}><//>
    </div>
  `;
}
