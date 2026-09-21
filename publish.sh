#!/data/data/com.termux/files/usr/bin/bash
# Uso: ./publish.sh miapp
APP=$1
SRC="$HOME/nexos/src/apps/$APP.js"
DST="apps/$APP.js"

if [ ! -f "$SRC" ]; then
  echo "No existe $SRC"
  exit 1
fi

cp "$SRC" "$DST"

SIZE=$(wc -c < "$DST")
HASH=$(sha256sum "$DST" | cut -d' ' -f1)

echo "App:   $APP"
echo "Size:  $SIZE"
echo "Hash:  $HASH"
echo ""
echo "Añade esto a catalog.json:"
echo '  {'
echo '    "id": "'$APP'",'
echo '    "name": "'$(echo $APP | tr a-z A-Z)'.APP",'
echo '    "description": "...",'
echo '    "author": "NexOS",'
echo '    "version": "1.0.0",'
echo '    "size": '$SIZE','
echo '    "url": "apps/'$APP'.js",'
echo '    "sha256": "'$HASH'",'
echo '    "type": "quickjs"'
echo '  },'
