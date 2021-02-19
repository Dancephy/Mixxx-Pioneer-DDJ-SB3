#!/bin/bash

MIXXX_CONTROLLER_DIR="$HOME/.mixxx/controllers";

cp lodash.mixxx.js "$MIXXX_CONTROLLER_DIR/lodash.mixxx.js";
cp midi-components-0.0.js "$MIXXX_CONTROLLER_DIR/midi-components-0.0.js";
cp Pioneer-DDJ-SB3-scripts.js "$MIXXX_CONTROLLER_DIR/Pioneer-DDJ-SB3-scripts.js";
cp Pioneer-DDJ-SB3.midi.xml "$MIXXX_CONTROLLER_DIR/Pioneer-DDJ-SB3.midi.xml";

echo "Update current mapping to new version?";
echo "Changes to the mapping will be lost.";

read -p "y/N: " -n1 override;
echo '';

if [ "$override" = 'y' ]
then
  echo "Overrinding....";

  CURR_DIR=$(pwd);

  cd "$MIXXX_CONTROLLER_DIR";

  for FILE in *;
  do
    if [[ "$FILE" == *"DDJ-SB3"* ]] && [[ "$FILE" == *".xml" ]];
    then
      cp "$CURR_DIR/Pioneer-DDJ-SB3.midi.xml" "$FILE";
    fi;
  done

  cd $CURR_DIR;
fi
