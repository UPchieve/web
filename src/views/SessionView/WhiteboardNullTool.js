/*
  This class is used to prevent multiple event listeners from firing.
  Now that we have an draggable and resizable window (Ai Tutor) over
  the whiteboard, we want to prevent the selected tool (e.g. brush) from
  drawing all over the whiteboard while you're moving or resizing the window
  I couldn't find an `unsetTool` method so this is the best I could do 🤷‍♂️
*/
export class WhiteboardNullTool {
  constructor(zwibblerContext) {
    this.ctx = zwibblerContext
  }

  enter() {}

  leave() {}

  getToolName() {
    return 'null-tool'
  }

  onMouseClick() {}

  onDoubleClick() {}

  onKeyCommand() {}

  onMouseDown() {}

  onMouseUp() {}

  onMouseMove() {}

  onMouseDrag() {}

  onMouseWheel() {}

  onContextMenu() {}

  onGesture() {
    return false
  }

  onColour() {}

  onOpacity() {}

  onRedraw() {}

  getToolProperties() {
    return {}
  }

  getToolNodeTypes() {
    return []
  }

  setToolProperty() {}
}
