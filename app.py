"""
Palmer Penguins — Exploratory Data Analysis
A Streamlit app that loads penguins.csv, walks through an initial EDA,
and renders a handful of interactive charts.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import streamlit as st

# ---------------------------------------------------------------------------
# Page setup
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Palmer Penguins EDA",
    page_icon="🐧",
    layout="wide",
)

# Fixed, colorblind-safe categorical palette. Order is fixed to the species
# order below so a species always gets the same color no matter which subset
# of the data is currently selected/filtered.
SPECIES_ORDER = ["Adelie", "Chinstrap", "Gentoo"]
PALETTE = dict(zip(SPECIES_ORDER, sns.color_palette("colorblind", n_colors=3)))
sns.set_theme(style="whitegrid")


@st.cache_data
def load_data(path: str = "data/penguins.csv") -> pd.DataFrame:
    df = pd.read_csv(path)
    return df


df = load_data()

st.title("🐧 Palmer Penguins — Exploratory Data Analysis")
st.write(
    "An interactive EDA of the Palmer Penguins dataset: 344 penguins across "
    "3 species, 3 islands in Antarctica's Palmer Archipelago, with body "
    "measurements collected between 2007 and 2009."
)

# ---------------------------------------------------------------------------
# Sidebar filters
# ---------------------------------------------------------------------------
st.sidebar.header("Filters")

species_filter = st.sidebar.multiselect(
    "Species", options=SPECIES_ORDER, default=SPECIES_ORDER
)
island_options = sorted(df["island"].dropna().unique())
island_filter = st.sidebar.multiselect(
    "Island", options=island_options, default=island_options
)
sex_options = sorted(df["sex"].dropna().unique())
sex_filter = st.sidebar.multiselect(
    "Sex", options=sex_options, default=sex_options
)

filtered = df[
    df["species"].isin(species_filter)
    & df["island"].isin(island_filter)
    & (df["sex"].isin(sex_filter) | df["sex"].isna())
]

st.sidebar.markdown(f"**Rows selected:** {len(filtered)} / {len(df)}")

# ---------------------------------------------------------------------------
# Section 1 — Data overview
# ---------------------------------------------------------------------------
st.header("1. Data overview")

col1, col2, col3, col4 = st.columns(4)
col1.metric("Rows", f"{filtered.shape[0]}")
col2.metric("Columns", f"{filtered.shape[1]}")
col3.metric("Species", f"{filtered['species'].nunique()}")
col4.metric("Missing values", f"{int(filtered.isna().sum().sum())}")

with st.expander("Preview raw data", expanded=True):
    st.dataframe(filtered.head(20), use_container_width=True)

with st.expander("Column data types"):
    st.dataframe(
        pd.DataFrame(
            {"column": df.dtypes.index, "dtype": df.dtypes.astype(str).values}
        ),
        use_container_width=True,
        hide_index=True,
    )

with st.expander("Missing values by column"):
    missing = filtered.isna().sum().rename("missing_count").to_frame()
    missing["missing_pct"] = (missing["missing_count"] / max(len(filtered), 1) * 100).round(1)
    st.dataframe(missing, use_container_width=True)

# ---------------------------------------------------------------------------
# Section 2 — Summary statistics
# ---------------------------------------------------------------------------
st.header("2. Summary statistics")

numeric_cols = filtered.select_dtypes(include=np.number).columns.tolist()
st.dataframe(filtered[numeric_cols].describe().T, use_container_width=True)

st.subheader("Counts by species and island")
count_table = (
    filtered.groupby(["species", "island"], observed=True)
    .size()
    .unstack(fill_value=0)
)
st.dataframe(count_table, use_container_width=True)

# ---------------------------------------------------------------------------
# Section 3 — Visualizations
# ---------------------------------------------------------------------------
st.header("3. Visualizations")

viz_tabs = st.tabs(
    ["Distribution", "Scatter", "Comparison by species", "Correlation heatmap"]
)

# --- Tab 1: Distribution ----------------------------------------------------
with viz_tabs[0]:
    st.subheader("Distribution of a numeric variable")
    num_var = st.selectbox("Variable", numeric_cols, index=numeric_cols.index("body_mass_g") if "body_mass_g" in numeric_cols else 0)

    fig, ax = plt.subplots(figsize=(8, 4.5))
    for sp in SPECIES_ORDER:
        if sp not in species_filter:
            continue
        subset = filtered.loc[filtered["species"] == sp, num_var].dropna()
        if len(subset) == 0:
            continue
        sns.histplot(
            subset, kde=True, color=PALETTE[sp], label=sp, alpha=0.5, ax=ax, element="step"
        )
    ax.set_xlabel(num_var.replace("_", " "))
    ax.set_ylabel("Count")
    ax.set_title(f"Distribution of {num_var.replace('_', ' ')} by species")
    ax.legend(title="Species")
    sns.despine(ax=ax)
    st.pyplot(fig, use_container_width=True)

# --- Tab 2: Scatter ----------------------------------------------------------
with viz_tabs[1]:
    st.subheader("Relationship between two numeric variables")
    c1, c2 = st.columns(2)
    x_var = c1.selectbox("X axis", numeric_cols, index=numeric_cols.index("bill_length_mm") if "bill_length_mm" in numeric_cols else 0)
    y_var = c2.selectbox("Y axis", numeric_cols, index=numeric_cols.index("bill_depth_mm") if "bill_depth_mm" in numeric_cols else 1)

    fig, ax = plt.subplots(figsize=(8, 5))
    for sp in SPECIES_ORDER:
        if sp not in species_filter:
            continue
        subset = filtered[filtered["species"] == sp]
        ax.scatter(
            subset[x_var], subset[y_var],
            color=PALETTE[sp], label=sp, alpha=0.75, edgecolor="white", linewidth=0.4, s=45,
        )
    ax.set_xlabel(x_var.replace("_", " "))
    ax.set_ylabel(y_var.replace("_", " "))
    ax.set_title(f"{y_var.replace('_', ' ')} vs {x_var.replace('_', ' ')}")
    ax.legend(title="Species")
    sns.despine(ax=ax)
    st.pyplot(fig, use_container_width=True)

# --- Tab 3: Comparison by species --------------------------------------------
with viz_tabs[2]:
    st.subheader("Compare a measurement across species")
    box_var = st.selectbox(
        "Measurement", numeric_cols,
        index=numeric_cols.index("flipper_length_mm") if "flipper_length_mm" in numeric_cols else 0,
        key="box_var",
    )
    fig, ax = plt.subplots(figsize=(8, 5))
    order = [sp for sp in SPECIES_ORDER if sp in species_filter]
    sns.boxplot(
        data=filtered, x="species", y=box_var, order=order,
        palette=[PALETTE[sp] for sp in order], ax=ax,
    )
    sns.stripplot(
        data=filtered, x="species", y=box_var, order=order,
        color="black", alpha=0.3, size=3, ax=ax,
    )
    ax.set_xlabel("Species")
    ax.set_ylabel(box_var.replace("_", " "))
    ax.set_title(f"{box_var.replace('_', ' ')} by species")
    sns.despine(ax=ax)
    st.pyplot(fig, use_container_width=True)

# --- Tab 4: Correlation heatmap ----------------------------------------------
with viz_tabs[3]:
    st.subheader("Correlation between numeric measurements")
    corr = filtered[numeric_cols].corr(numeric_only=True)
    fig, ax = plt.subplots(figsize=(7, 5.5))
    sns.heatmap(
        corr, annot=True, fmt=".2f", cmap="Blues", vmin=-1, vmax=1,
        square=True, linewidths=0.5, linecolor="white", ax=ax, cbar_kws={"label": "Pearson r"},
    )
    ax.set_title("Correlation matrix")
    st.pyplot(fig, use_container_width=True)

st.divider()
st.caption(
    "Data: Palmer Station LTER / palmerpenguins package (Gorman, Williams & Fraser, 2020). "
    "Built with Streamlit, pandas, matplotlib, and seaborn."
)
