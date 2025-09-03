{ pkgs }: {
  deps = [
    pkgs.python310
    pkgs.python310Packages.pip
    pkgs.python310Packages.virtualenv
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.gcc
    pkgs.binutils
  ];
  
  env = {
    PYTHON_LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.python310
    ];
    PYTHONHOME = "${pkgs.python310}";
    PYTHONBIN = "${pkgs.python310}/bin/python3.10";
    LANG = "en_US.UTF-8";
  };
}