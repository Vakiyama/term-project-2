{
    description = "bun/node ts project";

    inputs = {
        nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    };

    outputs = { self, nixpkgs, flake-utils }:
        flake-utils.lib.eachDefaultSystem ( system:
        let
            pkgs = nixpkgs.legacyPackages.${ system };
        in {
            devShell = with pkgs; pkgs.mkShell rec {
                buildInputs = [
                    bun
                    nodejs_20
                ];

                shellHook = ''
                    mkdir -p $PWD/.home
                    export HOME=$PWD/.home 

                    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath buildInputs}:$LD_LIBRARY_PATH"
                    export LD_LIBRARY_PATH="${pkgs.stdenv.cc.cc.lib.outPath}/lib:$LD_LIBRARY_PATH"
                '';
            };
        }
    );
}
