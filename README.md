# Mixxx-Pioneer-DDJ-SB3
Mixxx  controller mappings for the Pioneer DDJ SB3

These files are based on the DDJ-SB2 files that are part of the Mixxx distribution: https://github.com/mixxxdj/mixxx/tree/master/res/controllers, however they were adjusted to work fine with DDJ-SB3

## Known Issues
Decks 3 and 4 will NOT work unless you set the output of Mixxx to use DDJ-SB3. The controller requires that the on-board sound card be activated before it sends out the correct messages. It seems that is a bug (feature?) in the controller firmware. If pressing the deck 3 or deck 4 button does not light the button up, make sure you are using the controller sound card as output in Mixxx (Options -> Preferences -> Sound Hardware).

## Other branches
You may want to check the branch [8-hotcues](https://github.com/julia-otran/Mixxx-Pioneer-DDJ-SB3/tree/8-hotcues). The difference is the `HOT CUE` pads: Use the pads as hotcues, and pressing shift:
  - The 4 pads on top will delete hotcues 1-4
  - The 4 pads in bottom will be start, rewind, forward and censor.

The behavior on `master` branch is different:
  - The 4 pads on top are hotcues 1-4, pressing with shift will delete.
  - The 4 pads on bottom are start, rew, forward, censor. Pressing shift will give you hotcues 5-8

## Installing / Updating
- First option: Execute one of the scripts:
  ### Windows
  Just double-click the bat file, it will copy files for you (this is not a virus, it will just copy the files for you, if are feeling unsafe, copy files manualy)
  ```
  install-win.bat
  ```

  ### Linux
  1. Open a terminal
  2. `cd` to the directory where you downloaded / clonned this project
  3. Run `./install-linux.sh`

  ### MacOS
  1. Open a terminal
  2. `cd` to the directory where you downloaded / clonned this project
  3. Run `./install-osx.sh`

- Second option: You can just copy the files
```
Pioneer-DDJ-SB3-scripts.js
Pioneer-DDJ-SB3.midi.xml
```
to the Mixxx controllers folder.

*Beware: If you are updating, I would recommend that you delete any XML files that contains `DDJ-SB3` and activate your controller again in Mixxx*

## Using Effects
  - The 1, 2, 3 will always turn on/off the effect

  - The `Level` knob will change the effect unit `Master`, IF NONE EFFECT IS SELECTED.

  - Pressing SHIFT + 1, 2 or 3 will SELECT the effect. When there is a selected effect:
    - The `Level` now will change the `META` of the selected effect.

    - Holding SHIFT while changing `GAIN`, one of `EQ` or `FILTER` will change the selected effect params.

    - You can DELESECT it pressing SHIFT and the lighted effect button. After that no buttons will be lighted meaning that no effect if selected


## Midi Message Lists
* Midi Message List for the SB3 (PDF): https://www.pioneerdj.com/-/media/pioneerdj/software-info/controller/ddj-sb3/ddj-sb3_midi_message_list_e1.pdf
* Midi Message List for the SB2 (PDF), for comparison against SB3: http://faq.pioneerdj.com/files/img/DDJ-SB2_List_of_MIDI_Messages_E.pdf

## Running the Tests
1. Install Node
2. Install Yarn
3. Install Jest
4. run yarn test

## Linting
The mapping js file must not generate any eslint warnings in order to be merged into the mixxx project.
```
yarn run eslint Pioneer-DDJ-SB3-scripts.js
```


## Contributing
Please: **do not change the file `Pioneer-DDJ-SB3.midi.xml` manually**. Instead, modify first the files inside the `xmls` folder and after run `node ./compile-xml.js`. The script will merge recusively all xmls inside the xmls folder and compile it in the final xml.

## Feature Matrix

| Feature      | Deck 1 | Deck 2 | Deck 3 | Deck 4 |
|--------------|--------|--------|--------|--------|
| Play / Pause | Yes    | Yes    | Yes    | Yes    |
| Cue          | Yes    | Yes    | Yes    | Yes    |
| Key Lock     | Yes    | Yes    | Yes    | Yes    |
| Sync         | Yes    | Yes    | Yes    | Yes    |
| Tempo Range  | Yes    | Yes    | Yes    | Yes    |
| Fx           | Yes    | Yes    | Yes    | Yes    |
| Auto Loop    | Yes    | Yes    | Yes    | Yes    |
| Vynil / Slip | Yes    | Yes    | Yes    | Yes    |
| Hotcue       | Yes    | Yes    | Yes    | Yes    |
| Sampler      | Yes    | Yes    | Yes    | Yes    |
| Beat jump    | Yes    | Yes    | Yes    | Yes    |
| Roll         | Yes    | Yes    | Yes    | Yes    |
| Slicer!!!    | Yes    | Yes    | Yes    | Yes    |
| Eq           | Yes    | Yes    | Yes    | Yes    |

*In fact, I think all features are working. Let me know, or open a issue if you experience some problem.*
