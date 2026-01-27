{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

  outputs = {
    self,
    nixpkgs,
  }: let
    forAllSystems = nixpkgs.lib.genAttrs [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];
  in {
    packages = forAllSystems (system: let
      pkgs = nixpkgs.legacyPackages.${system};

      mkColanode = {
        pname,
        buildWorkspaces,
        installPhase,
        meta ? {},
      }:
        pkgs.buildNpmPackage {
          inherit meta pname installPhase;

          version = "1.0.0";
          src = ./.;

          nodejs = pkgs.nodejs_22;
          npmDepsHash = "sha256-i35U1Ejgv3mhLoe2JdNrv+s+2E3bl/sQVmhtEzxWpkY=";

          makeCacheWritable = true;
          env.ELECTRON_SKIP_BINARY_DOWNLOAD = "1";

          buildPhase = ''
            runHook preBuild
            ${pkgs.lib.concatMapStringsSep "\n" (w: "npm run build -w ${w}") buildWorkspaces}
            runHook postBuild
          '';
        };

      colanode-server = mkColanode {
        pname = "colanode-server";
        buildWorkspaces = ["@colanode/core" "@colanode/crdt" "@colanode/server"];

        installPhase = ''
          runHook preInstall

          mkdir -p $out/lib/colanode
          cp -r . $out/lib/colanode/

          mkdir -p $out/bin
          cat > $out/bin/colanode-server <<EOF
          #!${pkgs.bash}/bin/bash
          cd $out/lib/colanode
          exec ${pkgs.nodejs_22}/bin/node apps/server/dist/index.js "\$@"
          EOF
          chmod +x $out/bin/colanode-server

          runHook postInstall
        '';

        meta.mainProgram = "colanode-server";
      };

      colanode-web = mkColanode {
        pname = "colanode-web";

        buildWorkspaces = [
          "@colanode/core"
          "@colanode/crdt"
          "@colanode/client"
          "@colanode/ui"
          "@colanode/web"
        ];

        installPhase = ''
          mkdir -p $out/share/colanode-web
          cp -r apps/web/dist/* $out/share/colanode-web/
        '';
      };
    in {
      inherit colanode-server colanode-web;
      default = colanode-server;
    });

    nixosModules.default = {
      lib,
      pkgs,
      config,
      ...
    }: let
      cfg = config.services.colanode;
      configFile = pkgs.writeText "colanode-config.json" (builtins.toJSON cfg.config);

      inherit (lib) mkEnableOption mkOption mkIf types literalExpression getExe getExe';
    in {
      options.services.colanode = {
        enable = mkEnableOption "Colanode";

        server = mkOption {
          type = types.package;
          default = self.packages.${pkgs.stdenv.hostPlatform.system}.colanode-server;
          description = "The server package to use";
        };

        client = mkOption {
          type = types.package;
          default = self.packages.${pkgs.stdenv.hostPlatform.system}.colanode-web;
          description = "The client package to use";
        };

        config = mkOption {
          type = types.attrs;
          default = {};
          description = "Configuration for Colanode (see: https://colanode.com/docs/self-hosting/configuration)";
          example = literalExpression ''
            {
              storage.provider = {
                type = "file";
                directory = "/var/lib/colanode";
              };
            }
          '';
        };

        user = mkOption {
          type = types.str;
          default = "colanode";
          description = "User account under which Colanode runs";
        };

        group = mkOption {
          type = types.str;
          default = "colanode";
          description = "Group under which Colanode runs";
        };

        dataDir = mkOption {
          type = types.path;
          default = "/var/lib/colanode";
          description = "Directory where Colanode server data is stored";
        };

        root = mkOption {
          type = types.path;
          default = "/var/www/colanode";
          description = "Directory where the web interface is served from";
        };

        environmentFile = mkOption {
          type = types.nullOr types.path;
          default = null;
          description = "Environment file containing secrets";
          example = "/run/secrets/colanode";
        };
      };

      config = mkIf cfg.enable {
        users.users.${cfg.user} = {
          isSystemUser = true;
          group = cfg.group;
        };

        users.groups.${cfg.group} = {};

        systemd.services.colanode-server = {
          description = "Colanode Server";
          wantedBy = ["multi-user.target"];
          after = ["network.target"];

          serviceConfig =
            {
              Type = "simple";

              User = cfg.user;
              Group = cfg.group;
              WorkingDirectory = cfg.dataDir;

              ExecStartPre = "${getExe' pkgs.coreutils "ln"} -sf ${configFile} ${cfg.dataDir}/config.json";
              ExecStart = getExe cfg.server;
              Restart = "on-failure";
              RestartSec = "5s";

              ProtectSystem = "strict";
              PrivateTmp = true;
              ProtectHome = true;
              NoNewPrivileges = true;
              ReadWritePaths = [cfg.dataDir];
              Environment = "CONFIG=${cfg.dataDir}/config.json";
            }
            // lib.optionalAttrs (cfg.environmentFile != null) {
              EnvironmentFile = cfg.environmentFile;
            };
        };
      };
    };
  };
}
