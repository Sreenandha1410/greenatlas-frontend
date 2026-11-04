const [selectedTree, setSelectedTree] = useState(null);

const [newPosition, setNewPosition] = useState(null);

const handleSave = async () => {
  if (!selectedTree || !newPosition) return;

  try {
    await updateTreeLocation(
      selectedTree.tree_id,
      newPosition
    );

    // Update local tree data
    setTrees(previous =>
      previous.map(tree =>
        tree.tree_id === selectedTree.tree_id
          ? { ...tree, ...newPosition }
          : tree
      )
    );

    setSelectedTree(null);
    setNewPosition(null);

    alert('Tree location updated successfully');

  } catch (error) {
    alert('Failed to update tree location');
  }
};
