
SET IMAGE_NAME=yolo-label-studio
SET REGISTRY_PATH=registry.cn-hangzhou.aliyuncs.com/tunan-tb
echo "CURRENT_DIR is : %~dp0" 
cd /d %~dp0

@echo off
set /p BUILD_FLAG="Try to Build image %IMAGE_NAME%, confirm y|N:"
echo %BUILD_FLAG%
if "%BUILD_FLAG%"=="y" (
    docker build -t %IMAGE_NAME%:latest .
  
	if %errorlevel% == 0 (
		echo "image built successfully"
	) else (
		echo "image built failed"
		goto fail_end
	)
) else (
    goto end
)

set /p PUSH_FLAG="Try to push %IMAGE_NAME% to tuan-tb, confirm y|N:"
if "%PUSH_FLAG%"=="y" (
	docker tag %IMAGE_NAME%:latest %REGISTRY_PATH%/%IMAGE_NAME%:latest
	docker push %REGISTRY_PATH%/%IMAGE_NAME%:latest

	if %errorlevel% == 0 (
		echo "Push image done"
	) else (
		echo "Push image failed!"
		goto fail_end
	)

) else (
	goto end
)


:fail_end
   echo "script exec failed"

:end
   echo script end
@echo on 

pause
