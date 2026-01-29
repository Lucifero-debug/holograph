import GroupedBarChart3D from "./GroupedBarChart3D";

function chooseFacetKey(roles) {
  const temporal = Object.entries(roles)
    .filter(([, v]) => v.role === "temporal")
    .sort((a, b) => (a[1].granularity < b[1].granularity ? 1 : -1));

  if (temporal.length > 0) return temporal[0][0];

  const categorical = Object.entries(roles)
    .filter(([, v]) => v.role === "categorical")
    .sort((a, b) => (a[1].granularity < b[1].granularity ? 1 : -1));

  if (categorical.length > 0) return categorical[0][0];

  return null;
}

export default function FacetedGroupedBars({ data, config, roles }) {
  const facetKey = chooseFacetKey(roles);

  if (!facetKey) return <GroupedBarChart3D data={data} config={config} />;

  const facets = data.reduce((acc, row) => {
    const key = row[facetKey];
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      {Object.entries(facets).map(([facetValue, facetData]) => (
        <div key={facetValue}>
          <h3 className="text-cyan-400 text-xl mb-3">
            {facetKey}: {facetValue}
          </h3>

          <GroupedBarChart3D
            data={facetData}
            config={config}
          />
        </div>
      ))}
    </div>
  );
}
