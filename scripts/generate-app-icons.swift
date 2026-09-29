import AppKit
import Foundation
import ImageIO

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
guard let source = CGImageSourceCreateWithURL(root.appendingPathComponent("assets/logo.png") as CFURL, nil),
  let logo = CGImageSourceCreateImageAtIndex(source, 0, nil),
  let cropped = logo.cropping(to: CGRect(x: 88, y: 208, width: 320, height: 320)) else {
  fatalError("Missing assets/logo.png")
}

// The existing Meri davai desk logo includes this square D+ brand mark.
let mark = NSImage(cgImage: cropped, size: NSSize(width: 320, height: 320))

func render(_ size: Int, markFraction: CGFloat, at path: String) {
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
  NSColor.white.setFill()
  NSRect(x: 0, y: 0, width: size, height: size).fill()
  let width = CGFloat(size) * markFraction
  mark.draw(in: NSRect(x: (CGFloat(size) - width) / 2, y: (CGFloat(size) - width) / 2, width: width, height: width))
  context.flushGraphics()
  NSGraphicsContext.restoreGraphicsState()
  let output = root.appendingPathComponent(path)
  try! FileManager.default.createDirectory(at: output.deletingLastPathComponent(), withIntermediateDirectories: true)
  try! bitmap.representation(using: .png, properties: [:])!.write(to: output)
}

let iosPath = "ios/MdDesk/Images.xcassets/AppIcon.appiconset"
let iosSizes = [40, 60, 58, 87, 80, 120, 180, 1024]
let iosImages = iosSizes.map { size -> [String: String] in
  render(size, markFraction: 0.78, at: "\(iosPath)/icon-\(size).png")
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
  render(size, markFraction: 0.78, at: "\(directory)/ic_launcher.png")
  render(size, markFraction: 0.78, at: "\(directory)/ic_launcher_round.png")
  render(size * 9 / 4, markFraction: 0.62, at: "\(directory)/ic_launcher_foreground.png")
}
render(512, markFraction: 0.78, at: "android/app/src/main/ic_launcher-playstore.png")
