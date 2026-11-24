package net.aprep.region.pasaporteandino;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Base64;

import androidx.core.content.FileProvider;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKeys;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;

/**
 * Almacenamiento seguro del token de sesión (EncryptedSharedPreferences respaldado por Android Keystore)
 * y escritura de archivos temporales en caché para compartirlos con la hoja nativa.
 * El token nunca se guarda en localStorage ni en el bundle web.
 */
@CapacitorPlugin(name = "PaSecure")
public class PaSecurePlugin extends Plugin {
    private SharedPreferences prefs;

    private SharedPreferences prefs() throws Exception {
        if (prefs == null) {
            Context ctx = getContext();
            // API estable de security-crypto 1.0.0: clave maestra AES-256-GCM en Android Keystore.
            String alias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC);
            prefs = EncryptedSharedPreferences.create("pa_secure", alias, ctx,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM);
        }
        return prefs;
    }

    private static boolean validKey(String k) {
        return k != null && k.matches("[a-z_]{1,32}");
    }

    @PluginMethod
    public void get(PluginCall call) {
        String k = call.getString("key");
        if (!validKey(k)) { call.reject("clave inválida"); return; }
        try {
            JSObject r = new JSObject();
            r.put("value", prefs().getString(k, null));
            call.resolve(r);
        } catch (Exception e) { call.reject("almacenamiento seguro no disponible", e); }
    }

    @PluginMethod
    public void set(PluginCall call) {
        String k = call.getString("key");
        String v = call.getString("value");
        if (!validKey(k) || v == null || v.length() > 200) { call.reject("datos inválidos"); return; }
        try { prefs().edit().putString(k, v).apply(); call.resolve(); }
        catch (Exception e) { call.reject("almacenamiento seguro no disponible", e); }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String k = call.getString("key");
        if (!validKey(k)) { call.reject("clave inválida"); return; }
        try { prefs().edit().remove(k).apply(); call.resolve(); }
        catch (Exception e) { call.reject("almacenamiento seguro no disponible", e); }
    }

    /** Escribe un archivo (p. ej. tarjeta PNG para Instagram) en cache/compartir y devuelve un content:// URI. */
    @PluginMethod
    public void writeCache(PluginCall call) {
        String name = call.getString("name", "");
        String b64 = call.getString("base64", "");
        if (!name.matches("[A-Za-z0-9._-]{1,80}") || b64.length() > 20_000_000) { call.reject("archivo inválido"); return; }
        try {
            File dir = new File(getContext().getCacheDir(), "compartir");
            if (!dir.exists() && !dir.mkdirs()) throw new Exception("mkdir");
            File f = new File(dir, name);
            try (FileOutputStream out = new FileOutputStream(f)) { out.write(Base64.decode(b64, Base64.DEFAULT)); }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
            JSObject r = new JSObject();
            r.put("uri", uri.toString());
            call.resolve(r);
        } catch (Exception e) { call.reject("no se pudo escribir el archivo", e); }
    }
}
