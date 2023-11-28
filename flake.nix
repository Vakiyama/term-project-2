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
                    # set local home
                    LOCAL_HOME=$PWD/.home
                    mkdir -p $LOCAL_HOME
                    
                    # symlink nvim and starship 
                    if [ ! -L "$PWD/.home/.config/starship.toml" ]; then
                        ln -s $HOME/.config/starship.toml $LOCAL_HOME/.config/starship.toml
                    fi

                    export HOME=$LOCAL_HOME
                '';
            };
        }
    );
}
