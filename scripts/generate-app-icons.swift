import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
func color(_ hex: UInt32) -> NSColor {
  NSColor(
    red: CGFloat((hex >> 16) & 0xFF) / 255,
    green: CGFloat((hex >> 8) & 0xFF) / 255,
    blue: CGFloat(hex & 0xFF) / 255,
    alpha: 1
  )
}

func fill(_ path: NSBezierPath, with color: NSColor) {
  color.setFill()
  path.fill()
}

func drawPartnerMark() {
  let softWhite = color(0xC6E0FF)
  fill(NSBezierPath(roundedRect: NSRect(x: 115, y: 180, width: 300, height: 360), xRadius: 145, yRadius: 145), with: softWhite)
  fill(NSBezierPath(ovalIn: NSRect(x: 205, y: 505, width: 125, height: 125)), with: softWhite)
  fill(NSBezierPath(roundedRect: NSRect(x: 609, y: 180, width: 300, height: 360), xRadius: 145, yRadius: 145), with: softWhite)
  fill(NSBezierPath(ovalIn: NSRect(x: 694, y: 505, width: 125, height: 125)), with: softWhite)
  fill(NSBezierPath(roundedRect: NSRect(x: 300, y: 155, width: 424, height: 425), xRadius: 205, yRadius: 205), with: .white)
  fill(NSBezierPath(ovalIn: NSRect(x: 420, y: 500, width: 184, height: 184)), with: .white)

  fill(NSBezierPath(ovalIn: NSRect(x: 714, y: 706, width: 190, height: 190)), with: color(0x16A79A))
  fill(NSBezierPath(roundedRect: NSRect(x: 793, y: 744, width: 32, height: 114), xRadius: 8, yRadius: 8), with: .white)
  fill(NSBezierPath(roundedRect: NSRect(x: 752, y: 785, width: 114, height: 32), xRadius: 8, yRadius: 8), with: .white)
}

func render(_ size: Int, at path: String, adaptiveForeground: Bool = false) {
  guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: size,
    pixelsHigh: size,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  ), let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
    fatalError("Could not create icon bitmap")
  }
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = context
  context.imageInterpolation = .high
  let graphics = context.cgContext
  graphics.scaleBy(x: CGFloat(size) / 1024, y: CGFloat(size) / 1024)
  if !adaptiveForeground {
    color(0x286BF2).setFill()
    NSRect(x: 0, y: 0, width: 1024, height: 1024).fill()
  } else {
    graphics.translateBy(x: 154, y: 154)
    graphics.scaleBy(x: 0.7, y: 0.7)
  }
  drawPartnerMark()
  context.flushGraphics()
  NSGraphicsContext.restoreGraphicsState()
  let output = root.appendingPathComponent(path)
  try! FileManager.default.createDirectory(at: output.deletingLastPathComponent(), withIntermediateDirectories: true)
  try! bitmap.representation(using: .png, properties: [:])!.write(to: output)
}

let iosPath = "ios/MdDesk/Images.xcassets/AppIcon.appiconset"
let iosSizes = [40, 60, 58, 87, 80, 120, 180, 1024]
let iosImages = iosSizes.map { size -> [String: String] in
  render(size, at: "\(iosPath)/icon-\(size).png")
  let pointSize: Int
  let scale: Int
  let idiom: String
  switch size {
  case 40: (pointSize, scale, idiom) = (20, 2, "iphone")
  case 60: (pointSize, scale, idiom) = (20, 3, "iphone")
  case 58: (pointSize, scale, idiom) = (29, 2, "iphone")
  case 87: (pointSize, scale, idiom) = (29, 3, "iphone")
  case 80: (pointSize, scale, idiom) = (40, 2, "iphone")
  case 120: (pointSize, scale, idiom) = (40, 3, "iphone")
  case 180: (pointSize, scale, idiom) = (60, 3, "iphone")
  default: (pointSize, scale, idiom) = (1024, 1, "ios-marketing")
  }
  return ["filename": "icon-\(size).png", "idiom": idiom, "scale": "\(scale)x", "size": "\(pointSize)x\(pointSize)"]
}
// iPhone 60pt @2x shares icon-120.png with the 40pt @3x slot.
let contents: [String: Any] = [
  "images": iosImages + [["filename": "icon-120.png", "idiom": "iphone", "scale": "2x", "size": "60x60"]],
  "info": ["author": "xcode", "version": 1]
]
let contentsData = try! JSONSerialization.data(withJSONObject: contents, options: [.prettyPrinted, .sortedKeys])
try! contentsData.write(to: root.appendingPathComponent("\(iosPath)/Contents.json"))

let androidSizes = ["mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192]
for (density, size) in androidSizes {
  let directory = "android/app/src/main/res/mipmap-\(density)"
  render(size, at: "\(directory)/ic_launcher.png")
  render(size, at: "\(directory)/ic_launcher_round.png")
  render(size * 9 / 4, at: "\(directory)/ic_launcher_foreground.png", adaptiveForeground: true)
}
render(512, at: "android/app/src/main/ic_launcher-playstore.png")
