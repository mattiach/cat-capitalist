use tauri_plugin_dialog::DialogExt;

/// Asks where to save the backup and writes it there. Returns false if the player cancels.
/// Runs off the main thread: the blocking dialog would otherwise freeze the window it belongs to.
/// No `set_parent`: with it the dialog returned "cancelled" without ever showing.
#[tauri::command(async)]
fn export_save(window: tauri::WebviewWindow, contents: String) -> Result<bool, String> {
    let Some(path) = window
        .dialog()
        .file()
        .set_file_name("cat-capitalist.save")
        .add_filter("Cat Capitalist save", &["save"])
        .blocking_save_file()
    else {
        return Ok(false);
    };
    let path = path.into_path().map_err(|error| error.to_string())?;
    std::fs::write(path, contents).map_err(|error| error.to_string())?;
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![export_save])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
