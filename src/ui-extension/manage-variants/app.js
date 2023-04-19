import html from "https://cdn.skypack.dev/solid-js/html";
import {
  createResource,
  createMemo,
  For,
  Show
} from "https://cdn.skypack.dev/solid-js";
import { createStore } from "https://cdn.skypack.dev/solid-js/store"
import { customPrintQuery, createVariantMutation, updateVariantsMutation, createProductOptionMutation } from './gql.js';

async function getProducts() {
  return VendureUiClient.graphQlQuery(customPrintQuery, { slug: 'custom-print' });
}

async function createVariant(productId, width, height, material, optionIds) {
  const sku = `${material}-${width}-${height}`;
  const input = [{
    productId,
    translations: [{
      languageCode: 'en',
      name: `Custom Print ${width}x${height} ${material}`
    }],
    optionIds,
    price: 20000,
    sku,
    customFields: {
      width,
      height
    }
  }];

  return VendureUiClient.graphQlMutation(createVariantMutation, { input });
}

async function enableVariant(variantId) {
  return VendureUiClient.graphQlMutation(updateVariantsMutation, { input: [{
    id: variantId,
    enabled: true
  }]});
}

async function disableVariant(variantId) {
  return VendureUiClient.graphQlMutation(updateVariantsMutation, { input: [{
    id: variantId,
    enabled: false
  }]});
}

async function addOption(code, optionGroupId) {
  return VendureUiClient.graphQlMutation(createProductOptionMutation, { input: {
    productOptionGroupId: optionGroupId,
    code,
    translations: [{
      languageCode: 'en',
      name: code
    }]
  }})
}

function getSizes(product) {
  const group = product?.optionGroups?.find(g => g.name === 'size');
  const sizes = group?.options?.map(o => o.code) ?? [];
  const pattern = /^(?<width>\d+)x(?<height>\d+)$/;
  return sizes.sort((a, b) => {
    const { groups: sizeA } = pattern.exec(a);
    const { groups: sizeB } = pattern.exec(b);

    return parseInt(sizeA.width) * parseInt(sizeA.height) -
      parseInt(sizeB.width) * parseInt(sizeB.height);
  })
}

function getMaterials(product) {
  const group = product?.optionGroups?.find(g => g.name === 'material');
  return group?.options?.map(o => o.code) ?? [];
}

function VariantCell(props) {
  const className = createMemo(() => {
    if (props.variant?.enabled) {
      return 'enabled';
    } else if (props.variant) {
      return 'disabled';
    }

    return '';
  });

  const sizeOption = createMemo(() =>  {
    if (!props.productData) {
      return;
    }

    const group = props.productData.product.optionGroups.find(g => g.code === 'size');
    const option = group.options.find(o => o.code === props.size);
    return option;
  });

  const materialOption = createMemo(() => {
    if (!props.productData) {
      return;
    }

    const group = props.productData.product.optionGroups.find(g => g.code === 'material');
    const option = group.options.find(o => o.code === props.material);
    return option;
  });

  return html`
    <td
      class=${() => className()}
      onClick=${async () => {
        if (props.variant?.enabled && confirm('Disable variant?')) {
          await disableVariant(props.variant.id);
        } else if (props.variant && confirm('Enable variant?')) {
          await enableVariant(props.variant.id);
        } else if (confirm('Create variant?')) {
          await createVariant(props.productData.product.id, props.size.width, props.size.height, props.size.material, [sizeOption().id, materialOption().id]);
        }
        props.refetch();
      }}
    >${() => props.variant?.enabled ? 'Yes' : 'No'}</td>
  `;
}

function VariantTable(props) {
  const materials = createMemo(() => getMaterials(props.productData?.product));
  const sizes = createMemo(() => getSizes(props.productData?.product));
  const [state, setState] = createStore({
    addingSize: false,
    newWidth: undefined,
    newHeight: undefined
  });

  return html`
    <table>
      <thead>
        <tr>
          <th></th>
          <${For} each=${() => materials()}>
            ${material => html`
              <th>${material}</th>
            `}
          <//>
        </tr>
      </thead>
      <tbody>
        <${For} each=${() => sizes()}>
          ${size => html`
            <tr>
              <td>${size}</td>
              <${For} each=${() => materials()}>
                ${material => html`
                  <${VariantCell}
                    productData=${() => props.productData}
                    size=${() => size}
                    material=${() => material}
                    variant=${() => {
                      return props.variants.find(v => {
                        return v.customFields.material === material &&
                          `${v.customFields.width}x${v.customFields.height}` === size;
                      });
                    }}
                    refetch=${() => props.refetch}
                  ><//>
                `}
              <//>
            </tr>
          `}
        <//>
        <tr>
          <td>
            <${Show}
              when=${() => state.addingSize}
              fallback=${() => html`
                <button class="add" onClick=${() => setState("addingSize", true)}>+</button>
              `}
            >
              <div class="new-size evenly-spaced">
                <label>
                  Width
                  <input type="number" min=4 value=${() => state.newWidth} onInput=${(evt) => setState("newWidth", evt.target.value)} />
                </label>
                <label>
                  Height
                  <input type="number" min=4 value=${() => state.newHeight} onInput=${(evt) => setState("newHeight", evt.target.value)} />
                </label>
              </div>
              <div class="evenly-spaced">
                <button 
                  disabled=${() => !(state.newWidth && state.newHeight)}
                  onClick=${async () => {
                    const group = props.productData.product.optionGroups.find(g => g.code === 'size');
                    const code = `${state.newWidth}x${state.newHeight}`;
                    if (group.options.some(option => option.code === code)) {
                      return alert(`Option ${code} already exists`);
                    }

                    await addOption(`${state.newWidth}x${state.newHeight}`, group.id);
                    setState({
                      addingSize: false,
                      newWidth: undefined,
                      newHeight: undefined
                    });
                    props.refetch();
                  }}
                >
                  &#10004;
                </button>
                <button onClick=${() => setState({ newWidth: undefined, newHeight: undefined, addingSize: false })}>
                  &#10005;
                </buton>
              </div>
            <//>
          </td>
        </tr>
      </tbody>
    </table>
  `
}

export const App = () => {
  const [productData, { refetch }] = createResource(getProducts);

  return html`
    <div>
      <${VariantTable}
        variants=${() => productData()?.product?.variants ?? []}
        productData=${() => productData()}
        refetch=${() => refetch}
      ><//>
    </div>
  `;
}
