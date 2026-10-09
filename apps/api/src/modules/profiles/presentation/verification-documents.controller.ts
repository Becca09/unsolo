import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import { RequestDocumentUploadSchema, type RequestDocumentUploadInput } from "@unsolo/validation";
import { AuthGuard } from "../../auth/presentation/auth.guard";
import type { AuthenticatedUser } from "../../auth/application/auth.service";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { VerificationDocumentsService } from "../application/verification-documents.service";

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

/**
 * VerificationDocumentsController — owner-scoped document endpoints under
 * the caller's own business verification. File bytes never pass through
 * this API: upload is a signed-URL grant, download access is a short-lived
 * signed URL minted on read.
 */
@Controller("profiles/:profileId/verification/documents")
@UseGuards(AuthGuard)
export class VerificationDocumentsController {
  constructor(private readonly documents: VerificationDocumentsService) {}

  @Get()
  list(@Request() req: RequestWithUser, @Param("profileId", ParseUUIDPipe) profileId: string) {
    return this.documents.list(req.user.sub, profileId);
  }

  @Post()
  requestUpload(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Body(new ZodValidationPipe(RequestDocumentUploadSchema)) body: RequestDocumentUploadInput,
  ) {
    return this.documents.requestUpload(req.user.sub, profileId, body);
  }

  @Post(":documentId/confirm")
  confirm(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Param("documentId", ParseUUIDPipe) documentId: string,
  ) {
    return this.documents.confirmUpload(req.user.sub, profileId, documentId);
  }

  @Delete(":documentId")
  @HttpCode(204)
  remove(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Param("documentId", ParseUUIDPipe) documentId: string,
  ) {
    return this.documents.remove(req.user.sub, profileId, documentId);
  }
}
