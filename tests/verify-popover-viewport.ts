function calculatePopoverPosition({
  rect,
  viewportWidth,
  viewportHeight,
  popoverWidth = 270,
  preferredHeight = 440,
  minHeight = 220,
  margin = 12,
}: {
  rect?: { top: number; bottom: number; left: number; right: number };
  viewportWidth: number;
  viewportHeight: number;
  popoverWidth?: number;
  preferredHeight?: number;
  minHeight?: number;
  margin?: number;
}) {
  if (!rect) {
    return {
      top: Math.max(margin, Math.round((viewportHeight - preferredHeight) / 2)),
      left: Math.max(margin, Math.round((viewportWidth - popoverWidth) / 2)),
      maxHeight: Math.max(minHeight, viewportHeight - margin * 2),
    };
  }

  const spaceBelow = viewportHeight - rect.bottom - margin;
  const spaceAbove = rect.top - margin;

  let top = 0;
  let maxHeight = 0;

  if (spaceBelow >= 300 || spaceBelow >= spaceAbove) {
    // Open below
    top = rect.bottom + 6;
    maxHeight = Math.min(preferredHeight, viewportHeight - top - margin);
    if (top + minHeight > viewportHeight - margin) {
      top = Math.max(margin, viewportHeight - margin - minHeight);
      maxHeight = viewportHeight - top - margin;
    }
  } else {
    // Open above
    const availableAbove = spaceAbove - 6;
    maxHeight = Math.min(preferredHeight, Math.max(minHeight, availableAbove));
    top = Math.max(margin, rect.top - 6 - maxHeight);
  }

  let left = rect.left;
  if (left + popoverWidth > viewportWidth - margin) {
    left = viewportWidth - popoverWidth - margin;
  }
  if (left < margin) {
    left = margin;
  }

  return {
    top: Math.round(top),
    left: Math.round(left),
    maxHeight: Math.round(Math.max(minHeight, Math.min(maxHeight, viewportHeight - margin * 2))),
  };
}

async function runViewportTests() {
  console.log('--- RUNNING DATE PICKER VIEWPORT POSITIONING VERIFICATION ---\n');

  // Test 1: Opening near top of screen
  console.log('Test 1: Opening near the top of the screen:');
  const t1 = calculatePopoverPosition({
    rect: { top: 30, bottom: 58, left: 100, right: 180 },
    viewportWidth: 1280,
    viewportHeight: 800,
  });
  console.log('  Result:', t1);
  if (t1.top >= 12 && t1.top + t1.maxHeight <= 800 - 12 && t1.top === 64) {
    console.log('  ✓ Opens cleanly below the trigger without exceeding top or bottom margins.');
  } else {
    throw new Error('Test 1 failed');
  }

  // Test 2: Opening near the bottom of the screen
  console.log('\nTest 2: Opening near the bottom of the screen:');
  const t2 = calculatePopoverPosition({
    rect: { top: 740, bottom: 768, left: 100, right: 180 },
    viewportWidth: 1280,
    viewportHeight: 800,
  });
  console.log('  Result:', t2);
  if (t2.top >= 12 && t2.top + t2.maxHeight <= 740 && t2.top + t2.maxHeight <= 800 - 12) {
    console.log('  ✓ Opens cleanly above the trigger without clipping at top or bottom.');
  } else {
    throw new Error('Test 2 failed');
  }

  // Test 3: Opening near the right edge
  console.log('\nTest 3: Opening near the right edge:');
  const t3 = calculatePopoverPosition({
    rect: { top: 200, bottom: 228, left: 1200, right: 1270 },
    viewportWidth: 1280,
    viewportHeight: 800,
  });
  console.log('  Result:', t3);
  if (t3.left + 270 <= 1280 - 12 && t3.left >= 12) {
    console.log('  ✓ Shifts left to fit within viewport margin (left + width <= 1268).');
  } else {
    throw new Error('Test 3 failed');
  }

  // Test 4: Opening near the left edge
  console.log('\nTest 4: Opening near the left edge:');
  const t4 = calculatePopoverPosition({
    rect: { top: 200, bottom: 228, left: 4, right: 80 },
    viewportWidth: 1280,
    viewportHeight: 800,
  });
  console.log('  Result:', t4);
  if (t4.left >= 12) {
    console.log('  ✓ Shifts right to maintain minimum 12px margin.');
  } else {
    throw new Error('Test 4 failed');
  }

  // Test 5: Small browser window / laptop screen
  console.log('\nTest 5: Small browser window (e.g. 500px height):');
  const t5 = calculatePopoverPosition({
    rect: { top: 200, bottom: 228, left: 100, right: 180 },
    viewportWidth: 700,
    viewportHeight: 500,
  });
  console.log('  Result:', t5);
  if (t5.top >= 12 && t5.top + t5.maxHeight <= 500 - 12 && t5.maxHeight <= 500 - 24) {
    console.log('  ✓ Automatically shrinks maxHeight to fit within small screen dimensions.');
  } else {
    throw new Error('Test 5 failed');
  }

  // Test 6: Resizing simulation (large window to small window)
  console.log('\nTest 6: Window resize simulation:');
  const largeWin = calculatePopoverPosition({
    rect: { top: 400, bottom: 428, left: 300, right: 380 },
    viewportWidth: 1440,
    viewportHeight: 900,
  });
  const smallWin = calculatePopoverPosition({
    rect: { top: 250, bottom: 278, left: 200, right: 280 },
    viewportWidth: 600,
    viewportHeight: 450,
  });
  if (
    largeWin.top + largeWin.maxHeight <= 900 - 12 &&
    smallWin.top + smallWin.maxHeight <= 450 - 12 &&
    smallWin.left + 270 <= 600 - 12
  ) {
    console.log('  ✓ Responsive calculations adapt dynamically on resize across all window sizes.');
  } else {
    throw new Error('Test 6 failed');
  }

  console.log('\n--- ALL VIEWPORT POSITIONING & RESPONSIVENESS TESTS PASSED! ---');
}

runViewportTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
