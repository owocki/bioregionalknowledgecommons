#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Watershed Data Processing Script
# Downloads GRDC Major River Basins and creates simplified GeoJSON for web use
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_ROOT/public/data/watersheds"
TEMP_DIR="/tmp/watershed-processing"

echo "═══════════════════════════════════════════════════════════════════════"
echo "  Watershed Data Processing Script"
echo "═══════════════════════════════════════════════════════════════════════"

# Check for required tools
check_dependencies() {
    echo "Checking dependencies..."

    if ! command -v ogr2ogr &> /dev/null; then
        echo "❌ ogr2ogr not found. Install GDAL:"
        echo "   macOS: brew install gdal"
        echo "   Ubuntu: sudo apt-get install gdal-bin"
        exit 1
    fi

    if ! command -v mapshaper &> /dev/null; then
        echo "❌ mapshaper not found. Install it:"
        echo "   npm install -g mapshaper"
        exit 1
    fi

    echo "✓ All dependencies found"
}

# Download GRDC data
download_data() {
    echo ""
    echo "─────────────────────────────────────────────────────────────────────"
    echo "  Downloading GRDC Major River Basins..."
    echo "─────────────────────────────────────────────────────────────────────"

    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"

    if [ ! -f "GRDC_Major_River_Basins_json.zip" ]; then
        curl -L -o GRDC_Major_River_Basins_json.zip \
            "https://grdc.bafg.de/downloads/GRDC_Major_River_Basins_json.zip"
    else
        echo "✓ Using cached download"
    fi

    echo "Extracting..."
    unzip -o GRDC_Major_River_Basins_json.zip

    echo "✓ Download complete"
}

# Process and simplify the data
process_data() {
    echo ""
    echo "─────────────────────────────────────────────────────────────────────"
    echo "  Processing watershed data..."
    echo "─────────────────────────────────────────────────────────────────────"

    mkdir -p "$DATA_DIR"
    cd "$TEMP_DIR"

    # Find the basins GeoJSON file
    BASINS_FILE=$(find . -name "*basins*.json" -o -name "*Basins*.json" | head -1)

    if [ -z "$BASINS_FILE" ]; then
        echo "Looking for GeoJSON files..."
        ls -la *.json 2>/dev/null || ls -la */*.json 2>/dev/null || true
        BASINS_FILE=$(find . -name "*.json" -type f | head -1)
    fi

    if [ -z "$BASINS_FILE" ]; then
        echo "❌ Could not find basins GeoJSON file"
        exit 1
    fi

    echo "Found basins file: $BASINS_FILE"

    # Create simplified versions at different levels
    echo ""
    echo "Creating Level 1 (highly simplified, ~100KB)..."
    mapshaper "$BASINS_FILE" \
        -simplify 0.5% keep-shapes \
        -filter-fields MRBID,RIVER_NAME,AREA_SQKM \
        -o "$DATA_DIR/basins-level1.json" format=geojson

    echo "Creating Level 2 (simplified, ~500KB)..."
    mapshaper "$BASINS_FILE" \
        -simplify 2% keep-shapes \
        -filter-fields MRBID,RIVER_NAME,AREA_SQKM \
        -o "$DATA_DIR/basins-level2.json" format=geojson

    echo "Creating Level 3 (moderate detail, ~2MB)..."
    mapshaper "$BASINS_FILE" \
        -simplify 8% keep-shapes \
        -filter-fields MRBID,RIVER_NAME,AREA_SQKM \
        -o "$DATA_DIR/basins-level3.json" format=geojson

    echo "Creating Level 4 (full detail)..."
    mapshaper "$BASINS_FILE" \
        -simplify 25% keep-shapes \
        -filter-fields MRBID,RIVER_NAME,AREA_SQKM \
        -o "$DATA_DIR/basins-level4.json" format=geojson

    # Also create a combined "major basins" file for fallback
    echo "Creating major-basins.json (top 100 largest basins)..."
    mapshaper "$BASINS_FILE" \
        -simplify 5% keep-shapes \
        -filter-fields MRBID,RIVER_NAME,AREA_SQKM \
        -sort 'AREA_SQKM' descending \
        -filter 'this.id < 100' \
        -o "$DATA_DIR/major-basins.json" format=geojson

    echo ""
    echo "✓ Processing complete"
}

# Report file sizes
report_sizes() {
    echo ""
    echo "─────────────────────────────────────────────────────────────────────"
    echo "  Generated files:"
    echo "─────────────────────────────────────────────────────────────────────"

    ls -lh "$DATA_DIR"/*.json 2>/dev/null || echo "No files generated yet"
}

# Cleanup
cleanup() {
    echo ""
    read -p "Delete temporary files in $TEMP_DIR? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$TEMP_DIR"
        echo "✓ Cleaned up"
    fi
}

# Main
main() {
    check_dependencies
    download_data
    process_data
    report_sizes
    cleanup

    echo ""
    echo "═══════════════════════════════════════════════════════════════════════"
    echo "  ✓ Done! Watershed data is ready in: $DATA_DIR"
    echo "═══════════════════════════════════════════════════════════════════════"
}

main "$@"
