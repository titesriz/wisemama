const IDC_ARITY = {
  '⿰': 2,
  '⿱': 2,
  '⿲': 3,
  '⿳': 3,
  '⿴': 2,
  '⿵': 2,
  '⿶': 2,
  '⿷': 2,
  '⿸': 2,
  '⿹': 2,
  '⿺': 2,
  '⿻': 2,
};

function parseNode(chars, index = 0) {
  const value = chars[index];
  if (!value) return [null, index];
  const arity = IDC_ARITY[value];
  if (!arity) return [{ type: 'char', value }, index + 1];

  const children = [];
  let nextIndex = index + 1;
  for (let i = 0; i < arity; i += 1) {
    const [child, childNextIndex] = parseNode(chars, nextIndex);
    if (child) children.push(child);
    nextIndex = childNextIndex;
  }
  return [{ type: 'compound', operator: value, children }, nextIndex];
}

function collectLeafChars(node, output = []) {
  if (!node) return output;
  if (node.type === 'char') {
    output.push(node.value);
    return output;
  }
  (node.children || []).forEach((child) => collectLeafChars(child, output));
  return output;
}

export function parseDecompositionTree(decomposition = '') {
  const chars = Array.from(String(decomposition || '').trim());
  if (!chars.length) return null;
  const [tree] = parseNode(chars, 0);
  return tree;
}

export function getTopLevelComponents(decomposition = '') {
  const tree = parseDecompositionTree(decomposition);
  if (!tree) return [];
  if (tree.type === 'char') {
    return [{ index: 0, label: tree.value, node: tree }];
  }

  return (tree.children || []).map((child, index) => ({
    index,
    label: collectLeafChars(child, []).join('') || '?',
    node: child,
  }));
}
