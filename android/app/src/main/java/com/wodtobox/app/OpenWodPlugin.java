package com.wodtobox.app;

import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.OpenableColumns;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Locale;

@CapacitorPlugin(name = "OpenWod")
public class OpenWodPlugin extends Plugin {
  private static final String EXTRA_CONSUMED = "com.wodtobox.app.OPEN_WOD_CONSUMED";
  private static final int MAX_BYTES = 512 * 1024;
  private JSObject lastPayload;

  @Override
  public void load() {
    if (getActivity() != null) capture(getActivity().getIntent());
  }

  @Override
  protected void handleOnNewIntent(Intent intent) {
    capture(intent);
  }

  @PluginMethod
  public void consumePending(PluginCall call) {
    JSObject data = lastPayload != null ? lastPayload : new JSObject();
    lastPayload = null;
    call.resolve(data);
  }

  private void capture(Intent intent) {
    if (intent == null || intent.getBooleanExtra(EXTRA_CONSUMED, false)) return;
    String action = intent.getAction();
    if (!Intent.ACTION_VIEW.equals(action) && !Intent.ACTION_SEND.equals(action)) return;

    Uri uri = intent.getData();
    if (uri == null && Intent.ACTION_SEND.equals(action)) {
      uri = extraStream(intent);
    }
    if (uri == null && intent.getClipData() != null && intent.getClipData().getItemCount() > 0) {
      uri = intent.getClipData().getItemAt(0).getUri();
    }
    if (uri == null) return;

    String name = displayName(uri);
    String text = readUtf8(uri);
    JSObject data = new JSObject();
    if (text == null) {
      if (name == null || !name.toLowerCase(Locale.ROOT).endsWith(".wodtobox")) return;
      data.put("error", "read");
    } else if (!looksLikeShare(name, text)) {
      return;
    } else {
      data.put("text", text);
    }

    intent.putExtra(EXTRA_CONSUMED, true);
    if (getActivity() != null) getActivity().setIntent(intent);
    lastPayload = data;
    notifyListeners("openFile", data);
  }

  @SuppressWarnings("deprecation")
  private Uri extraStream(Intent intent) {
    if (Build.VERSION.SDK_INT >= 33) {
      return intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri.class);
    }
    return intent.getParcelableExtra(Intent.EXTRA_STREAM);
  }

  private boolean looksLikeShare(String name, String text) {
    if (name != null && name.toLowerCase(Locale.ROOT).endsWith(".wodtobox")) return true;
    if (text == null) return false;
    String trimmed = text.trim();
    return (
      trimmed.startsWith("{") &&
      (trimmed.contains("wodtobox.wod") || trimmed.contains("wodtobox.plan"))
    );
  }

  private String displayName(Uri uri) {
    Cursor cursor = null;
    try {
      cursor =
        getContext()
          .getContentResolver()
          .query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null);
      if (cursor != null && cursor.moveToFirst()) {
        int idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
        if (idx >= 0) {
          String name = cursor.getString(idx);
          if (name != null && !name.isEmpty()) return name;
        }
      }
    } catch (Exception ignored) {
    } finally {
      if (cursor != null) cursor.close();
    }
    return uri.getLastPathSegment();
  }

  private String readUtf8(Uri uri) {
    ContentResolver resolver = getContext().getContentResolver();
    try {
      resolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
    } catch (Exception ignored) {}
    try (InputStream in = resolver.openInputStream(uri)) {
      if (in == null) return null;
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      byte[] buf = new byte[4096];
      int n;
      int total = 0;
      while ((n = in.read(buf)) != -1) {
        total += n;
        if (total > MAX_BYTES) return null;
        out.write(buf, 0, n);
      }
      return out.toString("UTF-8");
    } catch (Exception e) {
      return null;
    }
  }
}
