package net.aprep.region.pasaporteandino;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PaSecurePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
